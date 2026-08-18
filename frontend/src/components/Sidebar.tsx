import React from 'react';
import { ViewModule, StoredFile } from '../types/file';

interface SidebarProps {
  currentModule: ViewModule;
  onSelectModule: (module: ViewModule) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  files: StoredFile[];
  gestureActive: boolean;
  serverOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  collapsed,
  onToggleCollapse,
  files,
  gestureActive,
  serverOnline,
}) => {
  const pdfCount = files.filter((f) => f.fileType === 'pdf').length;
  const glbCount = files.filter((f) => f.fileType === 'glb').length;

  return (
    <aside
      style={{
        width: collapsed ? 72 : 250,
        minWidth: collapsed ? 72 : 250,
        height: '100vh',
        background: '#090d16',
        borderRight: '1px solid #1c2333',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 200ms ease, min-width 200ms ease',
        zIndex: 60,
        userSelect: 'none',
      }}
    >
      {/* Top: Logo & Platform Title */}
      <div>
        <div
          style={{
            padding: collapsed ? '14px 8px' : '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            borderBottom: '1px solid #1c2333',
            background: 'rgba(14, 19, 34, 0.4)',
            height: 60,
          }}
        >
          <div
            onClick={() => onSelectModule('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            {/* Logo Image */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: 4,
              }}
            >
              <img
                src="/logo/logo-10.png"
                alt="OKMK"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: 0.5,
                    fontFamily: 'var(--font-display)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  OKMK Taqdimot
                </div>
                <div
                  style={{
                    fontSize: 8.5,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--cyan)',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  AI GESTURE & 3D HUB
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              title="Sidebarni yig'ish"
              style={{
                color: 'var(--text-dim)',
                fontSize: 14,
                padding: '4px 6px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid #1c2333',
              }}
            >
              «
            </button>
          )}
        </div>

        {/* Collapsed Toggle Button */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <button
              onClick={onToggleCollapse}
              title="Sidebarni kengaytirish"
              style={{
                color: 'var(--text-dim)',
                fontSize: 14,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid #1c2333',
              }}
            >
              »
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section 1: MONITORING */}
          <div>
            {!collapsed && (
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1.2,
                  color: 'var(--text-dim)',
                  padding: '0 10px 6px',
                  textTransform: 'uppercase',
                }}
              >
                Monitoring
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Dashboard Item */}
              <button
                onClick={() => onSelectModule('dashboard')}
                title="Boshqaruv paneli"
                style={{
                  ...menuItemStyle,
                  ...(currentModule === 'dashboard' ? activeMenuItemStyle : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16 }}>📊</span>
                {!collapsed && (
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>
                    Boshqaruv paneli
                  </span>
                )}
              </button>

              {/* Presentation Item */}
              <button
                onClick={() => onSelectModule('presentation')}
                title="Slayd Taqdimotlar"
                style={{
                  ...menuItemStyle,
                  ...(currentModule === 'presentation' ? activeMenuItemStyle : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16 }}>📄</span>
                {!collapsed && (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Slayd Taqdimot</span>
                    {pdfCount > 0 && <span style={badgeStyle}>{pdfCount}</span>}
                  </div>
                )}
              </button>

              {/* 3D Model Item */}
              <button
                onClick={() => onSelectModule('model3d')}
                title="3D Modellar & Konstruksiya"
                style={{
                  ...menuItemStyle,
                  ...(currentModule === 'model3d' ? activeMenuItemStyle : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16 }}>🧊</span>
                {!collapsed && (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>3D Modellar</span>
                    {glbCount > 0 && (
                      <span style={{ ...badgeStyle, background: 'var(--cyan-soft)', color: 'var(--cyan)' }}>
                        {glbCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: BOSHQARUV */}
          <div>
            {!collapsed && (
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1.2,
                  color: 'var(--text-dim)',
                  padding: '0 10px 6px',
                  textTransform: 'uppercase',
                }}
              >
                Boshqaruv
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Files library */}
              <button
                onClick={() => onSelectModule('files')}
                title="Fayllar kutubxonasi"
                style={{
                  ...menuItemStyle,
                  ...(currentModule === 'files' ? activeMenuItemStyle : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16 }}>📁</span>
                {!collapsed && (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Fayllar Kutubxonasi</span>
                    <span style={{ ...badgeStyle, background: 'rgba(255,255,255,0.06)' }}>
                      {files.length}
                    </span>
                  </div>
                )}
              </button>

              {/* AI Gesture Control */}
              <button
                onClick={() => onSelectModule('gesture')}
                title="AI Gesture Nazorati"
                style={{
                  ...menuItemStyle,
                  ...(currentModule === 'gesture' ? activeMenuItemStyle : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16 }}>🖐️</span>
                {!collapsed && (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>AI Gesture</span>
                    <span
                      style={{
                        ...badgeStyle,
                        background: gestureActive ? 'var(--amber-soft)' : 'rgba(255,255,255,0.04)',
                        color: gestureActive ? 'var(--amber)' : 'var(--text-dim)',
                      }}
                    >
                      {gestureActive ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )}
              </button>

              {/* Archive */}
              <button
                onClick={() => onSelectModule('archive')}
                title="Arxiv"
                style={{
                  ...menuItemStyle,
                  ...(currentModule === 'archive' ? activeMenuItemStyle : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16 }}>🗄️</span>
                {!collapsed && <span>Arxiv</span>}
              </button>
            </div>
          </div>

          {/* Section 3: TIZIM */}
          <div>
            {!collapsed && (
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1.2,
                  color: 'var(--text-dim)',
                  padding: '0 10px 6px',
                  textTransform: 'uppercase',
                }}
              >
                Tizim
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => onSelectModule('settings')}
                title="Sozlamalar"
                style={{
                  ...menuItemStyle,
                  ...(currentModule === 'settings' ? activeMenuItemStyle : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ fontSize: 16 }}>⚙️</span>
                {!collapsed && <span>Sozlamalar</span>}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom: TEZKOR MA'LUMOT */}
      {!collapsed ? (
        <div
          style={{
            margin: 12,
            padding: '12px 14px',
            borderRadius: 10,
            background: '#0e1322',
            border: '1px solid #1c2333',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: serverOnline ? 'var(--success)' : 'var(--danger)',
              fontSize: 10.5,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: serverOnline ? 'var(--success)' : 'var(--danger)',
                boxShadow: serverOnline ? '0 0 8px var(--success)' : 'none',
              }}
            />
            TEZKOR MA'LUMOT
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Server:</span>
              <span style={{ color: serverOnline ? '#fff' : 'var(--danger)' }}>
                {serverOnline ? '5050 Online' : 'Offline'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Materiallar:</span>
              <span style={{ color: '#fff' }}>{files.length} ta</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Gesture:</span>
              <span style={{ color: gestureActive ? 'var(--amber)' : 'var(--text-dim)' }}>
                {gestureActive ? 'Faol' : 'Kutishda'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Root Himoya:</span>
              <span style={{ color: 'var(--success)' }}>Faol</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: serverOnline ? 'var(--success)' : 'var(--danger)',
              boxShadow: serverOnline ? '0 0 8px var(--success)' : 'none',
            }}
          />
        </div>
      )}
    </aside>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 12.5,
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
  transition: 'all 160ms ease',
  width: '100%',
};

const activeMenuItemStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(0, 229, 255, 0.1) 100%)',
  border: '1px solid rgba(0, 229, 255, 0.3)',
  color: '#fff',
  fontWeight: 600,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
};

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  padding: '1px 6px',
  borderRadius: 10,
  background: 'rgba(59, 130, 246, 0.2)',
  color: 'var(--blue)',
  fontWeight: 600,
};
