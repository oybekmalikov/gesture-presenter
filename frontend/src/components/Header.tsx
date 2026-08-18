import React from 'react';
import { ViewModule } from '../types/file';

interface HeaderProps {
  currentModule: ViewModule;
  onSelectModule: (module: ViewModule) => void;
  serverOnline: boolean;
  gestureActive: boolean;
  onToggleGesture: () => void;
  currentFileName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onSelectModule,
  serverOnline,
  gestureActive,
  onToggleGesture,
  currentFileName,
}) => {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <header
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'linear-gradient(180deg, rgba(16, 22, 38, 0.95) 0%, rgba(10, 13, 22, 0.9) 100%)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        zIndex: 50,
        position: 'relative',
      }}
    >
      {/* Left: OKMK Logo & Brand Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        {/* OKMK Hexagon Emblem */}
        <div
          onClick={() => onSelectModule('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)',
              border: '1px solid var(--cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--cyan-glow)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                stroke="var(--cyan)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 6L17 12L12 18L7 12L12 6Z"
                fill="var(--amber)"
                fillOpacity="0.85"
              />
            </svg>
          </div>

          <div>
            <div
              style={{
                fontFamily: 'var(--font-brand)',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              OKMK <span style={{ color: 'var(--cyan)' }}>AI DEMO</span>
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                letterSpacing: 0.5,
              }}
            >
              KORPORATIV TAQDIMOT VA 3D PLATFORMA
            </div>
          </div>
        </div>

        {/* Current Active File Tag */}
        {currentFileName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              marginLeft: 12,
              maxWidth: 260,
            }}
          >
            <span style={{ fontSize: 12 }}>{currentModule === 'model3d' ? '🧊' : '📄'}</span>
            <span
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--cyan)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentFileName}
            </span>
          </div>
        )}
      </div>

      {/* Center: Module Navigation Switcher */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(6, 8, 14, 0.7)',
          padding: '4px 6px',
          borderRadius: 14,
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={() => onSelectModule('dashboard')}
          style={{
            ...navBtnStyle,
            ...(currentModule === 'dashboard' ? activeNavStyle : {}),
          }}
        >
          <span style={{ fontSize: 14 }}>📁</span> Kutubxona
        </button>
        <button
          onClick={() => onSelectModule('presentation')}
          style={{
            ...navBtnStyle,
            ...(currentModule === 'presentation' ? activeNavStyle : {}),
          }}
        >
          <span style={{ fontSize: 14 }}>📄</span> Slayd Taqdimot
        </button>
        <button
          onClick={() => onSelectModule('model3d')}
          style={{
            ...navBtnStyle,
            ...(currentModule === 'model3d' ? activeNavStyle : {}),
          }}
        >
          <span style={{ fontSize: 14 }}>🧊</span> 3D Modellar
        </button>
      </nav>

      {/* Right: Status Indicators & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Server Status Badge */}
        <div
          title={serverOnline ? 'Backend Server ulandi (Port 5050)' : 'Backend Server bilan aloqa yo\'q'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            background: serverOnline ? 'var(--success-soft)' : 'var(--danger-soft)',
            border: `1px solid ${serverOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: serverOnline ? 'var(--success)' : 'var(--danger)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: serverOnline ? 'var(--success)' : 'var(--danger)',
              boxShadow: serverOnline ? '0 0 8px var(--success)' : '0 0 8px var(--danger)',
            }}
          />
          {serverOnline ? 'API Online' : 'API Offline'}
        </div>

        {/* Gesture Camera Control Toggle */}
        <button
          onClick={onToggleGesture}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 10,
            background: gestureActive ? 'var(--amber-soft)' : 'var(--bg-surface-2)',
            border: `1px solid ${gestureActive ? 'var(--amber)' : 'var(--border)'}`,
            color: gestureActive ? 'var(--amber)' : 'var(--text-muted)',
            boxShadow: gestureActive ? 'var(--amber-glow)' : 'none',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>{gestureActive ? '🖐️ AI Gesture Faol' : '🖐️ Gesturni yoqish'}</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullScreen}
          title="To'liq ekran rejimi"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-surface-2)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
          }}
        >
          ⛶
        </button>
      </div>
    </header>
  );
};

const navBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 16px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-display)',
};

const activeNavStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(59, 130, 246, 0.2) 100%)',
  border: '1px solid var(--cyan)',
  color: '#fff',
  boxShadow: 'var(--cyan-glow)',
};
