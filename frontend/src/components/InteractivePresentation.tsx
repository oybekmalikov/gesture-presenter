import React, { useState } from 'react';
import { PresentationViewer } from './PresentationViewer';

interface InteractivePresentationProps {
  fileUrl: string;
  fileName?: string;
  onBack?: () => void;
}

export const InteractivePresentation: React.FC<InteractivePresentationProps> = ({
  fileUrl,
  fileName,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`interactive-pres-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Control Bar */}
      <div className="pres-top-controls-bar">
        <div className="pres-left-meta">
          {onBack && (
            <button type="button" className="pres-back-btn" onClick={onBack}>
              ✕ Yopish
            </button>
          )}
          <span className="pres-file-name-label">{fileName || 'Taqdimot'}</span>
        </div>

        <div className="pres-center-nav">
          <button
            type="button"
            className="pres-nav-btn"
            disabled={currentPage <= 1}
            onClick={handlePrev}
          >
            ◀ Oldingi
          </button>
          <span className="pres-page-indicator">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="pres-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={handleNext}
          >
            Keyingi ▶
          </button>
        </div>

        <div className="pres-right-actions">
          <button
            type="button"
            className="pres-zoom-btn"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            title="Kichiklashtirish"
          >
            🔍-
          </button>
          <button
            type="button"
            className="pres-zoom-btn"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            title="Kattalashtirish"
          >
            🔍+
          </button>
          <button
            type="button"
            className="pres-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'To`liq ekrandan chiqish' : 'To`liq ekran'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="pres-canvas-viewport">
        <PresentationViewer
          fileUrl={fileUrl}
          pageNumber={currentPage}
          zoom={zoom}
          onReady={(pages) => setTotalPages(pages || 1)}
        />
      </div>
    </div>
  );
};
