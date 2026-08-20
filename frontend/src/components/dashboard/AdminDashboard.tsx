// src/components/dashboard/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { dashboardApi, seminarsApi } from '../../services/api';
import { AdminDashboardData, Seminar } from '../../types';
import { StatCard } from './StatCard';
import { PresentationGrid8 } from './PresentationGrid8';
import { UnwatchedSeminarsSidebar } from './UnwatchedSeminarsSidebar';
import { useI18n } from '../../utils/i18n';

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4'];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const t = useI18n();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [allSeminars, setAllSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [dashData, sRes] = await Promise.all([
          dashboardApi.getAdminDashboard(),
          seminarsApi.findAll({ limit: 16 }),
        ]);

        if (mounted) {
          setData(dashData);
          if (sRes?.items) {
            setAllSeminars(sRes.items);
          }
        }
      } catch {}
      finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = data?.summary || {
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    totalSeminars: 0,
    liveSeminars: 0,
    scheduledSeminars: 0,
    totalStorageMB: 0,
  };

  const deptChartData = data?.charts?.departmentActivityBarChart || [];
  const growthChartData = data?.charts?.monthlySeminarGrowthLineChart || [];
  const storagePieData = data?.charts?.storageBreakdownPieChart || [];

  return (
    <div className="page active" id="page-dashboard">
      {/* Top Stats Strip — 6 ta KPI */}
      <div className="stats-strip">
        <StatCard
          title={t('Total Users')}
          value={summary.totalUsers}
          meta={`${summary.activeUsers} ${t('Active')} · ${summary.totalDepartments} bo'lim`}
          colorClass="sc-blue"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title={t('Total Seminars')}
          value={summary.totalSeminars}
          meta="Korxona bo'yicha barcha seminarlar"
          colorClass="sc-amber"
          onClick={() => navigate('/seminars')}
        />
        <StatCard
          title={t('Live Streams')}
          value={summary.liveSeminars}
          meta="Hozir faol efirlar"
          colorClass="sc-red"
          onClick={() => navigate('/live')}
          icon={summary.liveSeminars > 0 ? (
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'pulse 1.5s infinite',
              boxShadow: '0 0 6px rgba(239,68,68,0.5)',
            }} />
          ) : undefined}
        />
        <StatCard
          title={t('Scheduled Seminars')}
          value={summary.scheduledSeminars}
          meta="Rejalashtirilgan seminarlar"
          colorClass="sc-green"
        />
        <StatCard
          title={t('Storage Used')}
          value={`${summary.totalStorageMB} MB`}
          meta="Fayllar va 3D modellar"
          colorClass="sc-slate"
          onClick={() => navigate('/file-retention')}
        />
        <StatCard
          title={t('Departments')}
          value={summary.totalDepartments}
          meta="Kombinat bo'limlari"
          colorClass="sc-blue"
        />
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* 8-Presentation Grid */}
        <div style={{ gridColumn: 'span 8' }}>
          <PresentationGrid8
            seminars={allSeminars}
            loading={loading}
          />
        </div>

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <UnwatchedSeminarsSidebar />
        </div>

        {/* Department Activity Bar Chart */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Department Activity')}</div>
              <div className="card-subtitle">Bo'limlar kesimida seminarlar soni</div>
            </div>
          </div>
          <div className="card-body" style={{ height: 280, padding: 12 }}>
            {deptChartData.length === 0 ? (
              <div className="empty-state">{t('No records found')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="code" type="category" stroke="var(--text-muted)" fontSize={11} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="seminarsCount" name="Seminarlar soni" fill="var(--blue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Growth Line Chart */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Monthly Growth')}</div>
              <div className="card-subtitle">Oylar bo'yicha seminar yaratilishi dinamikasi</div>
            </div>
          </div>
          <div className="card-body" style={{ height: 280, padding: 12 }}>
            {growthChartData.length === 0 ? (
              <div className="empty-state">{t('No records found')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="total" name="Jami taqdimotlar" stroke="var(--blue)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="completed" name="Yakunlangan" stroke="var(--green)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Storage Breakdown Pie Chart */}
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Storage Breakdown')}</div>
              <div className="card-subtitle">Fayl turlari bo'yicha band qilingan hajm</div>
            </div>
            <div className="card-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/file-retention')}
              >
                Xotirani boshqarish →
              </button>
            </div>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
            <div style={{ height: 220 }}>
              {storagePieData.length === 0 ? (
                <div className="empty-state">Fayllar mavjud emas</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={storagePieData}
                      dataKey="totalMB"
                      nameKey="fileType"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {storagePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val} MB`, 'Hajmi']}
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Storage details table */}
            <div className="table-wrap">
              <table className="tbl admin-table">
                <thead>
                  <tr>
                    <th>Fayl turi</th>
                    <th>Soni</th>
                    <th>Hajmi (MB)</th>
                  </tr>
                </thead>
                <tbody>
                  {storagePieData.map((s, idx) => (
                    <tr key={s.fileType || idx}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        {s.fileType?.toUpperCase() || 'BOSHQA'}
                      </td>
                      <td style={{ fontFamily: 'var(--f-mono)' }}>{s.count}</td>
                      <td style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>{s.totalMB} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
