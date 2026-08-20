// src/pages/StatisticsPage.tsx
import React, { useEffect, useState } from 'react';
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
  AreaChart,
  Area
} from 'recharts';
import { dashboardApi } from '../services/api';
import { AdminDashboardData } from '../types';
import { useI18n } from '../utils/i18n';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const StatisticsPage: React.FC = () => {
  const t = useI18n();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    dashboardApi.getAdminDashboard()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const deptChartData = data?.charts?.departmentActivityBarChart || [];
  const growthChartData = data?.charts?.monthlySeminarGrowthLineChart || [];
  const storagePieData = data?.charts?.storageBreakdownPieChart || [];
  const popularTags = data?.charts?.popularTagsCloud || [];

  return (
    <div className="page active" id="page-statistics">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('Statistics')}</div>
          <div className="pg-sub">Korxona miqyosida statistikalar, diagrammalar va trendlar</div>
        </div>
      </div>

      <div className="main-grid">
        {loading ? (
          <div className="card" style={{ gridColumn: 'span 12', padding: 60, textAlign: 'center' }}>
            <div className="empty-state">{t('Loading')}</div>
          </div>
        ) : error || !data ? (
          <div className="card" style={{ gridColumn: 'span 12', padding: 60, textAlign: 'center' }}>
            <div className="empty-state" style={{ color: 'var(--danger)' }}>
              Statistik ma'lumotlarni yuklashda xatolik yuz berdi yoki ruxsat etilmagan.
            </div>
          </div>
        ) : (
          <>
            {/* Oylik Trend - Area Chart */}
            <div className="card" style={{ gridColumn: 'span 12' }}>
              <div className="card-header">
                <div className="card-title">Yillik seminar dinamikasi</div>
              </div>
              <div className="card-body" style={{ height: 320, padding: '20px 20px 10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthChartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border)',
                        borderRadius: 8,
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area type="monotone" dataKey="total" name="Jami taqdimotlar" stroke="var(--blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bo'limlar faolligi - Bar Chart */}
            <div className="card" style={{ gridColumn: 'span 8' }}>
              <div className="card-header">
                <div className="card-title">{t('Department Activity')}</div>
              </div>
              <div className="card-body" style={{ height: 350, padding: '20px 20px 10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="code" type="category" stroke="var(--text-pri)" fontSize={12} width={70} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border)',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="seminarsCount" name="Seminarlar soni" fill="var(--blue)" radius={[0, 6, 6, 0]} barSize={20}>
                      {deptChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Xotira va Fayllar - Pie Chart */}
            <div className="card" style={{ gridColumn: 'span 4' }}>
              <div className="card-header">
                <div className="card-title">Fayllar taqsimoti</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: 350 }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storagePieData}
                        dataKey="totalMB"
                        nameKey="fileType"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
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
                </div>
                {/* Legend Table */}
                <div style={{ padding: '0 20px 20px' }}>
                  {storagePieData.slice(0, 4).map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sec)' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        {s.fileType?.toUpperCase()}
                      </span>
                      <strong style={{ fontFamily: 'var(--f-mono)' }}>{s.totalMB} MB</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="card" style={{ gridColumn: 'span 12' }}>
              <div className="card-header">
                <div className="card-title">Ommabop teglar</div>
              </div>
              <div className="card-body" style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {popularTags.length === 0 ? (
                  <div className="empty-state">Ma'lumot topilmadi</div>
                ) : (
                  popularTags.map((tag, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--bg-surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 20,
                        fontSize: 13,
                        color: 'var(--text-pri)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ color: 'var(--blue)' }}>#{tag.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 10 }}>
                        {tag.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
