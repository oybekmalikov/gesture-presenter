// src/pages/UserMgmtPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { usersApi, departmentsApi } from '../services/api';
import { User, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';

export const UserMgmtPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const t = useI18n();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fio, setFio] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [lavozim, setLavozim] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.findAll({
        limit: 100,
      });
      if (res?.items) {
        setUsers(res.items);
        setTotal(res.total);
      }
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    departmentsApi
      .findAll()
      .then((res) => {
        if (Array.isArray(res)) setDepartmentsList(res);
      })
      .catch(() => {});
  }, []);

  const handleToggleActive = async (u: User) => {
    try {
      const updated = await usersApi.toggleActive(u.id);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: updated.isActive } : item)),
      );
    } catch (e: any) {
      setError(String(e));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fio.trim() || !username.trim()) {
      setCreateError('F.I.O va login kiritilishi shart');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      await usersApi.create({
        fio: fio.trim(),
        username: username.trim(),
        password: password.trim() || 'okmk2026',
        role,
        lavozim: lavozim.trim() || undefined,
        departmentId: departmentId || undefined,
      });
      setIsAddModalOpen(false);
      setFio('');
      setUsername('');
      setPassword('');
      setLavozim('');
      loadUsers();
    } catch (err: any) {
      const msg =
        err.response?.data?.message?.uz ||
        err.response?.data?.message ||
        'Xodim yaratishda xatolik yuz berdi';
      setCreateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setCreateLoading(false);
    }
  };

  const visible = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' || String(u.isActive) === statusFilter;
      const matchQuery = `${u.fio} ${u.username} ${u.department?.name || ''} ${u.lavozim || ''}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchRole && matchStatus && matchQuery;
    });
  }, [users, query, roleFilter, statusFilter]);

  return (
    <div className="page admin-page active">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('User Management')}</div>
          <div className="pg-sub">
            {users.length} {t('Total Users')} · {users.filter((u) => u.isActive).length} {t('Active')}
          </div>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            + {t('Add User')}
          </button>
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
          <select
            className="f-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{t('All Roles')}</option>
            <option value="user">Xodim (User)</option>
            <option value="head_department">Bo'lim boshlig'i</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <select
            className="f-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('All Status')}</option>
            <option value="true">{t('Active')}</option>
            <option value="false">{t('Inactive')}</option>
          </select>
          {(query || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
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
                  <th>{t('Full Name')}</th>
                  <th>{t('Username')}</th>
                  <th>{t('Role')}</th>
                  <th>{t('Department')}</th>
                  <th>{t('Position')}</th>
                  <th>{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id}>
                    <td className="user-name-cell" style={{ fontWeight: 700 }}>
                      {u.fio}
                    </td>
                    <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>{u.username}</td>
                    <td>
                      <span className={`badge ${u.role === 'superadmin' ? 'badge-purple' : u.role === 'admin' ? 'badge-blue' : u.role === 'head_department' ? 'badge-amber' : 'badge-slate'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.department?.name || '—'}</td>
                    <td>{u.lavozim || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={`pill ${u.isActive ? 'p-green' : 'p-red'} user-status`}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.isActive ? t('Active') : t('Inactive')}
                      </button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">{t('No users found')}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div
          className="camera-directory-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 480, margin: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div className="card-title">{t('Add User')}</div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {createError && (
              <div style={{ padding: '8px 16px', color: 'var(--red)', fontSize: 12 }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ padding: 16 }}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t('Full Name')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="F.I.O"
                  value={fio}
                  onChange={(e) => setFio(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t('Username')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Login"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t('Password')}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Standart: okmk2026"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t('Role')}</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value={Role.USER}>Xodim (User)</option>
                  <option value={Role.HEAD_DEPARTMENT}>Bo'lim boshlig'i</option>
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.SUPERADMIN}>Superadmin</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">{t('Department')}</label>
                <select
                  className="form-input"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Bo'limni tanlang...</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">{t('Position')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masalan: Yetakchi muhandis"
                  value={lavozim}
                  onChange={(e) => setLavozim(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? t('Loading') : t('Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMgmtPage;
