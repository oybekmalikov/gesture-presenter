// src/components/notifications/NotificationDropdown.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useI18n } from '../../utils/i18n';

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const t = useI18n();

  return (
    <div className="notif-dropdown">
      <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 700, fontSize: 12 }}>{t('Notifications')}</span>
        {unreadCount > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '2px 6px' }}
            onClick={() => markAllAsRead()}
          >
            Barchasini o'qilgan qilish
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          {t('No notifications')}
        </div>
      ) : (
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {notifications.slice(0, 15).map((n) => (
            <div
              key={n.id}
              className="notif-item"
              role="button"
              tabIndex={0}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: !n.isRead ? 'var(--blue-lt)' : 'transparent',
              }}
              onClick={() => {
                markAsRead(n.id);
                if (n.meta?.seminarId) {
                  navigate(`/seminars/${n.meta.seminarId}`);
                }
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)', marginBottom: 3 }}>
                {n.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sec)', lineHeight: 1.35, marginBottom: 4 }}>
                {n.message}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--f-mono)' }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
