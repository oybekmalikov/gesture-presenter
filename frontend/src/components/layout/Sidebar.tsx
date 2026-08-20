// src/components/layout/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../utils/i18n';
import { dashboardApi } from '../../services/api';

export const Sidebar: React.FC = () => {
  const { user, isSuperadmin, isAdmin, isHeadDepartment } = useAuth();
  const t = useI18n();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('safeguard_sidebar_collapsed') === '1';
  });

  const [stats, setStats] = useState({
    totalSeminars: 0,
    liveSeminars: 0,
    storageMB: 0,
  });

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        const data = await dashboardApi.getDashboard();
        if (mounted && data) {
          const s = data as any;
          setStats({
            totalSeminars: s.summary?.totalSeminars || s.summary?.publicSeminarsCount || 0,
            liveSeminars: s.summary?.liveSeminars || s.summary?.liveSeminarsCount || 0,
            storageMB: s.summary?.totalStorageMB || 0,
          });
        }
      } catch {}
    };

    loadStats();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadStats();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('safeguard_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

  const toggleLabel = collapsed ? "Yoyish" : "Yig'ish";

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        type="button"
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={toggleSidebar}
      >
        <span className="sidebar-toggle-mark">{collapsed ? '»' : '«'}</span>
      </button>

      {/* ─── 1. ASOSIY — Barcha rollar uchun ─── */}
      <div className="nav-group">
        <div className="nav-group-label">{t('Monitoring')}</div>

        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="8.5" y="2" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="2" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span>{t('Dashboard')}</span>
        </NavLink>

        <NavLink
          to="/seminars"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M6 3H4a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V4a1 1 0 00-1-1h-2" stroke="currentColor" strokeWidth="1.4" />
            <rect x="6" y="1.5" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span>{t('Seminars')}</span>
        </NavLink>

        <NavLink
          to="/live"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="currentColor" opacity="0.2" />
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4.5 3.5a7 7 0 000 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M11.5 3.5a7 7 0 010 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{t('Live Sessions')}</span>
          {stats.liveSeminars > 0 && (
            <span className="nav-badge nb-red">{stats.liveSeminars}</span>
          )}
        </NavLink>

        <NavLink
          to="/bookmarks"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 2h10v12l-5-3.5L3 14V2z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span>{t('Bookmarks')}</span>
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L9.5 5.5L13.5 7L9.5 8.5L8 12.5L6.5 8.5L2.5 7L6.5 5.5L8 1.5Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span>{t('AI Assistant')}</span>
          <span className="nav-badge nb-blue">AI</span>
        </NavLink>

        <NavLink
          to="/statistics"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M2 14h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="3" y="8" width="2" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="7" y="4" width="2" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="11" y="6" width="2" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="8" cy="2.5" r="1" fill="currentColor" />
            <circle cx="12" cy="4" r="1" fill="currentColor" />
            <path d="M4 6l4-3.5L12 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span>{t('Statistics')}</span>
        </NavLink>

        {/* Mening seminarlarim — Superadmin uchun ko'rinmaydi */}
        {!isSuperadmin && (
          <NavLink
            to="/my-seminars"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M6 3H4a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V4a1 1 0 00-1-1h-2" stroke="currentColor" strokeWidth="1.4" />
              <rect x="6" y="1.5" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="8" cy="9" r="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6.5 11.5c.4 1 1 1.5 1.5 1.5s1.1-.5 1.5-1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span>{t('My Seminars')}</span>
          </NavLink>
        )}
      </div>

      {/* ─── 2. BO'LIM BOSHQARUVI — Faqat HEAD_DEPARTMENT ─── */}
      {isHeadDepartment && (
        <div className="nav-group">
          <div className="nav-group-label">{t('Management')}</div>
          <NavLink
            to="/team"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1.5 14c.4-3 2-4.5 4.5-4.5S10.1 11 10.5 14M11 4h4M13 2v4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>{t('My Team')}</span>
          </NavLink>
        </div>
      )}

      {/* ─── 3. TIZIM BOSHQARUVI — ADMIN va SUPERADMIN ─── */}
      {(isAdmin || isSuperadmin) && (
        <div className="nav-group">
          <div className="nav-group-label">{t('System')}</div>

          <NavLink
            to="/users"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1.5 14c.4-3 2-4.5 4.5-4.5S10.1 11 10.5 14M11 4h4M13 2v4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>{t('User Management')}</span>
          </NavLink>

          <NavLink
            to="/file-retention"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="4" rx="6" ry="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 4v8c0 1.1 2.7 2 6 2s6-.9 6-2V4" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 8c0 1.1 2.7 2 6 2s6-.9 6-2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>{t('File Retention')}</span>
          </NavLink>

          {isSuperadmin && (
            <NavLink
              to="/audit"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 2h10v12H3zM5.5 5h5M5.5 8h5M5.5 11h3" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span>{t('Audit logs')}</span>
            </NavLink>
          )}
        </div>
      )}

      {/* Sidebar Footer with Health / Operational Summary */}
      <div className="sidebar-footer">
        <div className="health-card">
          <div className="health-title">{t('Operational Summary')}</div>

          <div className="summary-row">
            <span>{t('Live Streams')}</span>
            <strong className={stats.liveSeminars > 0 ? 'summary-alert' : ''}>
              {stats.liveSeminars}
            </strong>
          </div>

          <div className="summary-row">
            <span>{t('Total Seminars')}</span>
            <strong>{stats.totalSeminars}</strong>
          </div>

          <div className="summary-row">
            <span>{t('Storage Used')}</span>
            <strong className="summary-ok">
              {stats.storageMB > 0 ? `${stats.storageMB} MB` : '100% OK'}
            </strong>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
