import React, { useEffect, useMemo, useState } from 'react';
import { auditApi } from '../services/api';
import { useI18n } from '../utils/i18n';

export const AuditLogsPage: React.FC = () => {
  const t = useI18n();

  const [logs, setLogs] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    auditApi
      .findAll(1, 200)
      .then((res) => {
        if (mounted && res?.items) {
          setLogs(res.items);
        }
      })
      .catch((err) => {
        if (mounted) setError(String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const actions = [...new Set(logs.map((item) => item.action).filter(Boolean))];
  const entities = [...new Set(logs.map((item) => item.entityType).filter(Boolean))];

  const visible = useMemo(() => {
    return logs.filter((item) => {
      const actorName = item.user?.fio || item.user?.username || '';
      const matchesQuery = [actorName, item.action, item.entityType, item.entityId, item.ipAddress]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());

      return (
        matchesQuery &&
        (action === 'all' || item.action === action) &&
        (entity === 'all' || item.entityType === entity)
      );
    });
  }, [logs, query, action, entity]);

  return (
    <div className="page admin-page active">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('Audit logs')}</div>
          <div className="pg-sub">
            Tizim xavfsizlik va ma'muriy harakatlar tarixi · {visible.length} ta yozuv
          </div>
        </div>
      </div>

      <div className="admin-page-body">
        <div className="filter-bar admin-filter-bar">
          <input
            className="f-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search logs')}
          />
          <select className="f-select" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="all">{t('All actions')}</option>
            {actions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
          <select className="f-select" value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="all">{t('All objects')}</option>
            {entities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
          {(query || action !== 'all' || entity !== 'all') && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQuery('');
                setAction('all');
                setEntity('all');
              }}
            >
              {t('Reset filters')}
            </button>
          )}
        </div>

        {error && <div className="user-error" style={{ color: 'var(--red)', marginBottom: 12 }}>{error}</div>}

        <div className="card admin-table-card">
          <div className="user-table-wrap">
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
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td className="audit-time" style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {item.user ? `${item.user.fio} (${item.user.username})` : 'Tizim'}
                    </td>
                    <td>
                      <span className="badge badge-blue">{item.action}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                      {item.entityType} {item.entityId ? `#${item.entityId.slice(0, 8)}` : ''}
                    </td>
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                      {item.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">{t('No records found')}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
