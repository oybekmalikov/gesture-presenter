// src/components/dashboard/SuperadminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, seminarsApi } from '../../services/api';
import { SuperadminDashboardData, Seminar } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { useI18n } from '../../utils/i18n';

export const SuperadminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const t = useI18n();

  const [data, setData] = useState<SuperadminDashboardData | null>(null);

  useEffect(() => {
    let mounted = true;
    dashboardApi
      .getSuperadminDashboard()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const auditLogs = data?.audit?.recentLogs || [];
  const totalLogs = data?.audit?.totalLogsCount || auditLogs.length;

  return (
    <div>
      {/* Admin Dashboard Core (Stats, Grid, Charts) */}
      <AdminDashboard />

      {/* Superadmin Dedicated: Audit & Security Overview Section */}
      <div style={{ marginTop: 24 }}>
        <div className="card" style={{ width: '100%' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Audit logs')} & Tizim xavfsizligi</div>
              <div className="card-subtitle">
                Jami {totalLogs} ta operatsiya qayd etilgan · So'nggi faolliklar
              </div>
            </div>
            <div className="card-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/audit')}
              >
                Barcha jurnallarni ko'rish →
              </button>
            </div>
          </div>
          <div className="card-body">
            {auditLogs.length === 0 ? (
              <div className="empty-state">{t('No records found')}</div>
            ) : (
              <div className="table-wrap">
                <table className="tbl admin-table">
                  <thead>
                    <tr>
                      <th>{t('Time')}</th>
                      <th>{t('User')}</th>
                      <th>{t('Action')}</th>
                      <th>{t('Object')}</th>
                      <th>IP Manzil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.slice(0, 8).map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {log.user ? `${log.user.fio} (${log.user.username})` : 'Tizim'}
                        </td>
                        <td>
                          <span className="badge badge-blue">{log.action}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                          {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                        </td>
                        <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
