// src/components/dashboard/PresentationGrid8.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Seminar, SeminarStatus } from '../../types';
import { useI18n } from '../../utils/i18n';

interface Props {
  seminars: Seminar[];
  loading?: boolean;
}

/* ── SVG Icons ── */
const EyeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const HeartIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CubeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const DocIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export const PresentationGrid8: React.FC<Props> = ({ seminars, loading }) => {
  const navigate = useNavigate();
  const t = useI18n();

  // Take up to 8 seminars (prioritizing LIVE, then SCHEDULED, then COMPLETED)
  const sorted = [...seminars].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    if (a.status === SeminarStatus.SCHEDULED && b.status !== SeminarStatus.SCHEDULED) return -1;
    if (a.status !== SeminarStatus.SCHEDULED && b.status === SeminarStatus.SCHEDULED) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const displayList = sorted.slice(0, 8);

  const getPrimaryFileType = (seminar: Seminar): string => {
    if (seminar.files && seminar.files.length > 0) {
      const f = seminar.files[0];
      if (f.fileType === '3d' || f.originalName?.match(/\.(step|stp|glb|gltf)$/i)) return '3D MODEL';
      if (f.fileType === 'pdf' || f.originalName?.endsWith('.pdf')) return 'PDF';
      if (f.originalName?.match(/\.(pptx|ppt)$/i)) return 'PPTX';
      if (f.fileType === 'video' || f.originalName?.match(/\.(mp4|webm)$/i)) return 'VIDEO';
      return f.fileType?.toUpperCase() || 'DOC';
    }
    return 'SEMINAR';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">{t('Recent Live & Scheduled Presentations')}</div>
          <div className="card-subtitle">
            {displayList.filter((s) => s.isLive).length > 0
              ? `${displayList.filter((s) => s.isLive).length} ta jonli efir faol · Jami 8 ta ko'rsatilgan`
              : `Barcha faol va yaqinda o'tkazilgan taqdimotlar`}
          </div>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/seminars')}
          >
            Barchasini ko'rish →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          {t('Loading')}
        </div>
      ) : displayList.length === 0 ? (
        <div className="empty-state" style={{ padding: '48px 0' }}>
          Hozircha taqdimotlar mavjud emas
        </div>
      ) : (
        <div className="presentation-grid-8">
          {displayList.map((item) => {
            const isLive = item.isLive || item.status === SeminarStatus.LIVE;
            const fileType = getPrimaryFileType(item);
            const authorName = item.author?.fio || item.author?.username || 'OKMK Mutaxassisi';
            const initials = authorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'O';

            return (
              <div
                key={item.id}
                className={`presentation-card ${isLive ? 'live-glow' : ''}`}
                onClick={() => {
                  if (isLive) {
                    navigate(`/live/${item.id}`);
                  } else {
                    navigate(`/seminars/${item.id}`);
                  }
                }}
              >
                {/* Thumbnail wrap */}
                <div
                  className="presentation-thumb-wrap"
                  style={
                    item.coverImageUrl
                      ? {
                          backgroundImage: `url(${item.coverImageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  {/* Status Badge */}
                  {isLive ? (
                    <div className="presentation-badge-tag badge-live-stream">
                      <span className="dot" />
                      <span>{t('Live Now')}</span>
                    </div>
                  ) : item.status === SeminarStatus.SCHEDULED ? (
                    <div className="presentation-badge-tag badge-scheduled-tag">
                      <span>{t('Scheduled')}</span>
                    </div>
                  ) : item.status === SeminarStatus.DRAFT ? (
                    <div className="presentation-badge-tag" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
                      <span>Qoralama</span>
                    </div>
                  ) : (
                    <div className="presentation-badge-tag badge-completed-tag">
                      <span>{t('Completed')}</span>
                    </div>
                  )}

                  {/* File Type Pill */}
                  <div className="presentation-file-type-pill">{fileType}</div>

                  {/* Vector Placeholder / Graphic */}
                  {!item.coverImageUrl && (
                    <div style={{ opacity: 0.25 }}>
                      {fileType === '3D MODEL' ? <CubeIcon /> : <DocIcon />}
                    </div>
                  )}
                </div>

                {/* Content info */}
                <div className="presentation-content">
                  <div className="presentation-title" title={item.title}>
                    {item.title}
                  </div>

                  <div className="presentation-author-row">
                    <div className="presentation-author-avatar">{initials}</div>
                    <div className="presentation-author-name">{authorName}</div>
                    <div className="presentation-metrics-row">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <EyeIcon /> {item.viewCount || 0}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <HeartIcon /> {item.likesCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PresentationGrid8;
