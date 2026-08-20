// src/components/layout/Topbar.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { LangFlag } from '../common/LangFlag';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { ConfirmModal } from '../common/ConfirmModal';
import { LANGUAGES, useI18n } from '../../utils/i18n';

export const Topbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const t = useI18n(language);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeLang = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];
  const userDivision = user?.department?.code || user?.department?.name || 'MBF';

  const getInitials = (name?: string) => {
    if (!name) return 'OK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="topbar">
      <button className="mob-menu-btn" type="button" aria-label="Toggle menu" />

      {/* Brand Logo */}
      <div className="logo" onClick={() => navigate('/')}>
        <div className="logo-mark">
          <img src="/assets/AGMK_LOGO.gif" alt="OKMK" />
        </div>
        <div className="logo-wordmark">
          <div className="logo-name">
            {language === 'ru' ? (
              <>ОКМК <span>Семинар</span></>
            ) : (
              <>OKMK <span>Taqdimot</span></>
            )}
          </div>
          <div className="logo-sub">
            {t('Platform PPE Control')}
          </div>
        </div>
      </div>

      <div className="topbar-sep" />

      {/* Live Site Chip */}
      <div className="site-chip" onClick={() => navigate('/seminars')}>
        <div className="live-ring">
          <div className="live-dot" />
        </div>
        <div className="site-name">{userDivision}</div>
      </div>

      {/* Right Controls */}
      <div className="topbar-right">
        {/* Language Switcher */}
        <div
          className="lang-switcher"
          onClick={(e) => {
            e.stopPropagation();
            setIsLangOpen((prev) => !prev);
          }}
        >
          <div className="lang-current">
            <LangFlag lang={activeLang.code} />
            <span className="lang-text">{activeLang.code.toUpperCase()}</span>
            <svg viewBox="0 0 16 16" fill="none" className="lang-chevron">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {isLangOpen && (
            <div className="lang-menu" onClick={(e) => e.stopPropagation()}>
              {LANGUAGES.map((opt) => (
                <div
                  key={opt.code}
                  className="lang-option"
                  onClick={() => {
                    setLanguage(opt.code as any);
                    setIsLangOpen(false);
                  }}
                >
                  <LangFlag lang={opt.code} />
                  <span className="lang-name">{opt.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          className="tb-ico"
          type="button"
          title={theme === 'dark' ? "Yorug' mavzuga o'tish" : "Qorong'i mavzuga o'tish"}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 16 16" fill="none">
              <path
                d="M14 10.5a6 6 0 01-8.5-8.5 6.5 6.5 0 108.5 8.5z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        {/* Notifications */}
        {isAuthenticated && (
          <div className="notif-wrapper" ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="tb-ico"
              type="button"
              title={t('Notifications')}
              onClick={() => setIsNotifOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2C5.79 2 4 3.79 4 6v3l-1.5 2h11L12 9V6c0-2.21-1.79-4-4-4z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M6.5 13c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
              {unreadCount > 0 && <div className="notif-badge">{unreadCount}</div>}
            </button>

            {isNotifOpen && <NotificationDropdown />}
          </div>
        )}

        {/* Authenticated Operator Pill / Guest Sign-In */}
        {isAuthenticated && user ? (
          <>
            <div
              className="operator-pill"
              onClick={() => navigate('/profile')}
              title={t('Profile Settings')}
            >
              <div className="op-av">{getInitials(user.fio || user.username)}</div>
              <div>
                <div className="op-nm">{user.fio || user.username}</div>
                <div className="op-rl">{user.role}</div>
              </div>
            </div>

            <button
              className="tb-ico logout-button"
              type="button"
              title={t('Logout')}
              onClick={() => setShowLogoutConfirm(true)}
            >
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 4l3 4-3 4M14 8H5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 8 }}
            onClick={() => navigate('/login')}
          >
            {t('Sign In')}
          </button>
        )}
      </div>
      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={showLogoutConfirm}
        title="Tizimdan chiqish"
        message="Haqiqatan ham tizimdan chiqmoqchimisiz? Joriy sessiyangiz yakunlanadi."
        confirmText="Ha, chiqish"
        cancelText="Bekor qilish"
        variant="warning"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default Topbar;
