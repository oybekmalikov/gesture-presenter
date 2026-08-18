import React from 'react';
import { ViewModule } from '../types/file';

interface NavbarProps {
  currentModule: ViewModule;
  serverOnline: boolean;
  gestureActive: boolean;
  onToggleGesture: () => void;
  activeFileName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  serverOnline,
  gestureActive,
  onToggleGesture,
  activeFileName,
}) => {
  const getBreadcrumbTitle = () => {
    switch (currentModule) {
      case 'dashboard':
        return 'Monitoring / Boshqaruv paneli';
      case 'presentation':
        return 'Taqdimotlar / Slayd Ko\'rish';
      case 'model3d':
        return '3D Modellar / Digital Twin';
      case 'files':
        return 'Boshqaruv / Fayllar kutubxonasi';
      case 'gesture':
        return 'Boshqaruv / AI Gesture Nazorati';
      case 'archive':
        return 'Boshqaruv / Arxiv';
      case 'settings':
        return 'Tizim / Sozlamalar';
      default:
        return 'OKMK Platformasi';
    }
  };

  return (
    <header
      style={{
        height: 60,
        minHeight: 60,
        background: '#090d16',
        borderBottom: '1px solid #1c2333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 50,
      }}
    >
      {/* Left: MBF Status Badge + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* MBF Status Badge from ui-overview1.png */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 20,
            background: serverOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${serverOnline ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: serverOnline ? 'var(--success)' : 'var(--danger)',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: serverOnline ? 'var(--success)' : 'var(--danger)',
              boxShadow: serverOnline ? '0 0 8px var(--success)' : 'none',
            }}
          />
          MBF ONLINE
        </div>

        {/* Breadcrumb title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: '#fff',
            }}
          >
            {getBreadcrumbTitle()}
          </span>

          {activeFileName && (
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--cyan)',
                background: 'var(--bg-surface-2)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeFileName}
            </span>
          )}
        </div>
      </div>

      {/* Right: Language, Gesture toggle, Notification, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Language selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--bg-surface-2)',
            border: '1px solid #1c2333',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <span>🇺🇿</span>
          <span>UZ</span>
          <span style={{ fontSize: 9 }}>▼</span>
        </div>

        {/* AI Gesture Toggle Pill */}
        <button
          onClick={onToggleGesture}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 8,
            background: gestureActive ? 'var(--amber-soft)' : 'var(--bg-surface-2)',
            border: `1px solid ${gestureActive ? 'var(--amber)' : '#1c2333'}`,
            color: gestureActive ? 'var(--amber)' : 'var(--text-muted)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}
        >
          <span>🖐️</span>
          <span>{gestureActive ? 'Gesture Faol' : 'Gesture Yoqish'}</span>
        </button>

        {/* Notifications Icon with Badge */}
        <div
          style={{
            position: 'relative',
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--bg-surface-2)',
            border: '1px solid #1c2333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          🔔
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              padding: '1px 5px',
              borderRadius: 8,
              background: '#ef4444',
              color: '#fff',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
          >
            374
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#1c2333' }} />

        {/* User Profile matching ui-overview1.png */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          {/* Avatar initials badge */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ШМ
          </div>

          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                lineHeight: 1.2,
              }}
            >
              Pardaev Dilshod Maxammat o'g'li
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              admin (root)
            </div>
          </div>

          {/* Exit icon */}
          <span
            title="Chiqish"
            style={{
              color: 'var(--text-dim)',
              fontSize: 16,
              marginLeft: 4,
            }}
          >
            ⇥
          </span>
        </div>
      </div>
    </header>
  );
};
