// src/components/InteractivePresentation.tsx
import React, { useState, useEffect } from 'react';
import { PresentationViewer } from './PresentationViewer';
import { LaserPointer } from './LaserPointer';

interface InteractivePresentationProps {
  fileUrl: string;
  fileName?: string;
  pageNumber?: number;
  onPageChange?: (page: number) => void;
  isPresenter?: boolean;
  laserPointer?: { x: number; y: number; visible: boolean } | null;
  onBack?: () => void;
}

export const InteractivePresentation: React.FC<InteractivePresentationProps> = ({
  fileUrl,
  fileName,
  pageNumber,
  onPageChange,
  isPresenter = true,
  laserPointer,
  onBack,
}) => {
  const [internalPage, setInternalPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.15);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentPage = pageNumber !== undefined ? pageNumber : internalPage;

  const handlePrev = () => {
    const next = Math.max(1, currentPage - 1);
    if (onPageChange) onPageChange(next);
    else setInternalPage(next);
  };

  const handleNext = () => {
    const next = Math.min(totalPages, currentPage + 1);
    if (onPageChange) onPageChange(next);
    else setInternalPage(next);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: '#070b14',
        borderRadius: isFullscreen ? 0 : 12,
        overflow: 'hidden',
        ...(isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
            }
          : {}),
      }}
    >
      {/* Sleek Top Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 30,
        }}
      >
        {/* Left: File Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={onBack}
            >
              ✕ Yopish
            </button>
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#e2e8f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 240,
            }}
          >
            📄 {fileName || 'Taqdimot'}
          </span>
        </div>

        {/* Center: Slide Nav (Presenter has buttons, Viewers see synced indicator) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPresenter ? (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
                disabled={currentPage <= 1}
                onClick={handlePrev}
              >
                ◀ Oldingi
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'var(--f-mono)',
                  color: '#fff',
                  fontWeight: 700,
                  background: 'rgba(0,0,0,0.4)',
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '4px 10px' }}
                disabled={currentPage >= totalPages}
                onClick={handleNext}
              >
                Keyingi ▶
              </button>
            </>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontFamily: 'var(--f-mono)',
                color: 'var(--blue)',
                fontWeight: 700,
                background: 'rgba(59,130,246,0.15)',
                padding: '3px 10px',
                borderRadius: 6,
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              Slayd {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {/* Right: Zoom & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 12, padding: '3px 8px' }}
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            title="Kichiklashtirish"
          >
            🔍-
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 12, padding: '3px 8px' }}
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            title="Kattalashtirish"
          >
            🔍+
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 12, padding: '3px 8px' }}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'To`liq ekrandan chiqish' : 'To`liq ekran'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>
      </div>

      {/* Main PDF Canvas Stage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PresentationViewer
          fileUrl={fileUrl}
          pageNumber={currentPage}
          zoom={zoom}
          onReady={(pages) => setTotalPages(pages || 1)}
        />
        {laserPointer && laserPointer.visible && (
          <LaserPointer point={{ x: laserPointer.x, y: laserPointer.y }} />
        )}
      </div>
    </div>
  );
};

export default InteractivePresentation;
