// src/components/dashboard/HeadDepartmentDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { dashboardApi, seminarsApi } from '../../services/api';
import { HeadDepartmentDashboardData, Seminar } from '../../types';
import { StatCard } from './StatCard';
import { PresentationGrid8 } from './PresentationGrid8';
import { UnwatchedSeminarsSidebar } from './UnwatchedSeminarsSidebar';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../utils/i18n';

export const HeadDepartmentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useI18n();

  const [data, setData] = useState<HeadDepartmentDashboardData | null>(null);
  const [departmentSeminars, setDepartmentSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [dashData, sRes] = await Promise.all([
          dashboardApi.getDepartmentDashboard(),
          seminarsApi.findAll({ tab: 'department', limit: 12 }),
        ]);

        if (mounted) {
          setData(dashData);
          if (sRes?.items) {
            setDepartmentSeminars(sRes.items);
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

  const deptName = data?.department?.name || user?.department?.name || "Bo'lim";
  const statusStats = data?.seminarsByStatus || {
    total: 0,
    scheduled: 0,
    live: 0,
    completed: 0,
    draft: 0,
  };
  const topSpeakers = data?.topSpeakers || [];
  const monthlyTrend = data?.monthlyTrend || [];

  return (
    <div className="page active" id="page-dashboard">
      {/* Top Stats Strip — 6 ta KPI */}
      <div className="stats-strip">
        <StatCard
          title={t('Total Seminars')}
          value={statusStats.total}
          meta={`${deptName} barcha seminarlari`}
          colorClass="sc-blue"
          onClick={() => navigate('/seminars?tab=department')}
        />
        <StatCard
          title={t('Active Users')}
          value={data?.department?.activeUsersCount || 0}
          meta="Bo'limdagi faol mutaxassislar"
          colorClass="sc-green"
          onClick={() => navigate('/team')}
        />
        <StatCard
          title={t('Scheduled Seminars')}
          value={statusStats.scheduled}
          meta="Kutilayotgan taqdimotlar"
          colorClass="sc-amber"
        />
        <StatCard
          title={t('Live Streams')}
          value={statusStats.live}
          meta="Hozir jonli efirdagi taqdimotlar"
          colorClass="sc-red"
          icon={statusStats.live > 0 ? (
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
          title={t('Completed Seminars')}
          value={statusStats.completed}
          meta="Muvaffaqiyatli yakunlangan"
          colorClass="sc-slate"
        />
        <StatCard
          title={t('Draft Seminars')}
          value={statusStats.draft}
          meta="Qoralama holat seminarlari"
          colorClass="sc-blue"
        />
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* 8-Presentation Grid */}
        <div style={{ gridColumn: 'span 8' }}>
          <PresentationGrid8
            seminars={departmentSeminars.length > 0 ? departmentSeminars : (data?.recentSeminars || [])}
            loading={loading}
          />
        </div>

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <UnwatchedSeminarsSidebar />
        </div>

        {/* Top Department Speakers Card */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Top Speakers')}</div>
              <div className="card-subtitle">Bo'limning eng faol ma'ruzachilari</div>
            </div>
            <div className="card-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/team')}
              >
                Jamoa ro'yxati →
              </button>
            </div>
          </div>
          <div className="card-body">
            {topSpeakers.length === 0 ? (
              <div className="empty-state">{t('No records found')}</div>
            ) : (
              <div className="table-wrap">
                <table className="tbl admin-table">
                  <thead>
                    <tr>
                      <th>Xodim</th>
                      <th>Lavozim</th>
                      <th>Seminarlar</th>
                      <th>Ko'rishlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSpeakers.map((sp) => (
                      <tr key={sp.userId}>
                        <td style={{ fontWeight: 700 }}>{sp.fio}</td>
                        <td>{sp.lavozim || '—'}</td>
                        <td style={{ fontFamily: 'var(--f-mono)', fontWeight: 600 }}>{sp.seminarsCount}</td>
                        <td style={{ fontFamily: 'var(--f-mono)' }}>{sp.totalViews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Activity Growth Chart */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Monthly Growth')}</div>
              <div className="card-subtitle">Oylar kesimida o'tkazilgan taqdimotlar soni</div>
            </div>
          </div>
          <div className="card-body" style={{ height: 260, padding: 12 }}>
            {monthlyTrend.length === 0 ? (
              <div className="empty-state">Dinamika ma'lumotlari mavjud emas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
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
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Seminarlar soni"
                    stroke="var(--blue)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--blue)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadDepartmentDashboard;
