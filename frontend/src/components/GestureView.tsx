import React from 'react';
import { HandCameraWidget } from './HandCameraWidget';
import { GestureHUD } from './GestureHUD';
import { RawHand } from '../hooks/useHandTracking';

interface GestureViewProps {
  active: boolean;
  loading: boolean;
  error: string | null;
  hands: RawHand[];
  videoRef: React.RefObject<HTMLVideoElement>;
  label: string;
  onToggle: () => void;
}

const GESTURE_GUIDE = [
  {
    icon: '✋ ↑',
    name: 'Keyingi slayd / Qismni o\'ngga burish',
    desc: 'Qo\'lni pastdan yuqoriga yoki o\'ng tomonga silkitish',
    badge: 'SLIDE NEXT / ROTATE',
  },
  {
    icon: '✋ ↓',
    name: 'Oldingi slayd / Qismni chapga burish',
    desc: 'Qo\'lni tepadan pastga yoki chap tomonga silkitish',
    badge: 'SLIDE PREV / ROTATE',
  },
  {
    icon: '🤲',
    name: 'Zoom (Yaqinlashtirish / Uzoqlashtirish)',
    desc: 'Ikki qo\'l orasidagi masofani ochish yoki yopish',
    badge: 'ZOOM IN / OUT',
  },
  {
    icon: '☝️',
    name: 'Lazer Kursor & 3D Detal Tanlash',
    desc: 'Ko\'rsatkich barmoq bilan ekrandagi nuqtani ko\'rsatish (magnet bilan ulanadi)',
    badge: 'LASER POINTER',
  },
  {
    icon: '✊',
    name: 'Zoomni tiklash / 3D Sochish/Yig\'ish',
    desc: 'Musht tugish orqali kamerani asl holatiga qaytarish yoki modelni sochish',
    badge: 'RESET / EXPLODE',
  },
];

export const GestureView: React.FC<GestureViewProps> = ({
  active,
  loading,
  error,
  hands,
  videoRef,
  label,
  onToggle,
}) => {
  return (
    <div
      style={{
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        background: '#090d16',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
            AI Gesture Nazorat Markazi (MediaPipe 2.0 Vision)
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Kamera orqali qo'l harakatlarini aniqlash, slaydlarni almashtirish va 3D modellarni manipulyatsiya qilish
          </p>
        </div>

        <button
          onClick={onToggle}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            background: active ? 'var(--amber-soft)' : 'var(--cyan-soft)',
            border: `1px solid ${active ? 'var(--amber)' : 'var(--cyan)'}`,
            color: active ? 'var(--amber)' : 'var(--cyan)',
            fontWeight: 600,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {active ? '🛑 Kamerani to\'xtatish' : '▶ Kamerani ishga tushirish'}
        </button>
      </div>

      {/* Main Grid: Guide List + Live Camera View */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 560px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left: Gesture instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: '#0e1322',
              border: '1px solid #1c2333',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
            }}
          >
            📋 Qo'l harakatlari qo'llanmasi
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GESTURE_GUIDE.map((g, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: '#0e1322',
                  border: '1px solid #1c2333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'rgba(0, 229, 255, 0.1)',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {g.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{g.name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'var(--cyan-soft)',
                        color: 'var(--cyan)',
                        border: '1px solid rgba(0, 229, 255, 0.3)',
                      }}
                    >
                      {g.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Camera Monitor */}
        <div
          style={{
            background: '#0e1322',
            border: '1px solid #1c2333',
            borderRadius: 12,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Jonli Kamera & Landmark Vizualizatsiyasi</span>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: active ? 'var(--success)' : 'var(--text-dim)',
              }}
            >
              {active ? '● LIVE STREAM' : 'OFFLINE'}
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 340,
              borderRadius: 10,
              overflow: 'hidden',
              background: '#06080e',
              border: '1px solid #1c2333',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                opacity: active ? 0.6 : 0,
              }}
            />
            {!active && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ fontSize: 32 }}>📷</span>
                <span>{loading ? 'Kamera ishga tushmoqda…' : error || 'Kamera o\'chiq'}</span>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#131929',
              border: '1px solid #1c2333',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: active ? 'var(--cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Holat:</span>
            <strong>{active ? label : 'Kamerani yoqing'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
