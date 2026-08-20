// src/pages/DepartmentTeamPage.tsx
import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';

export const DepartmentTeamPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const t = useI18n();

  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    usersApi
      .getMyTeam({ limit: 50 })
      .then((res) => {
        if (mounted && res?.items) {
          setTeamMembers(res.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visible = teamMembers.filter((m) =>
    `${m.fio} ${m.username} ${m.lavozim || ''}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="page admin-page active">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('My Team')}</div>
          <div className="pg-sub">
            {currentUser?.department?.name || "Bo'lim"} xodimlari · Jami {teamMembers.length} kishi
          </div>
        </div>
      </div>

      <div className="admin-page-body">
        <div className="filter-bar admin-filter-bar">
          <input
            className="f-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search users')}
          />
        </div>

        <div className="card admin-table-card">
          <div className="user-table-wrap">
            <table className="tbl admin-table">
              <thead>
                <tr>
                  <th>{t('Full Name')}</th>
                  <th>{t('Username')}</th>
                  <th>{t('Position')}</th>
                  <th>{t('Role')}</th>
                  <th>{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr key={m.id}>
                    <td className="user-name-cell" style={{ fontWeight: 700 }}>
                      {m.fio}
                    </td>
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>{m.username}</td>
                    <td>{m.lavozim || 'Xodim'}</td>
                    <td>
                      <span className="badge badge-blue">{m.role}</span>
                    </td>
                    <td>
                      <span className={`pill ${m.isActive ? 'p-green' : 'p-red'}`}>
                        {m.isActive ? t('Active') : t('Inactive')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">{t('No users found')}</div>
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

export default DepartmentTeamPage;
