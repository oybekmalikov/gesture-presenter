// src/components/seminars/SeminarCard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Seminar, SeminarStatus } from '../../types';
import { seminarsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../utils/i18n';

interface SeminarCardProps {
  seminar: Seminar;
  onBookmarkChanged?: (seminarId: string, isSaved: boolean) => void;
}

/* ── SVG Icons ── */
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'}>
    <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4.5 3.5 3.5 0 0113.5 7C13.5 10.5 8 14 8 14z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 3h12v8H5l-3 3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'}>
    <path d="M3.5 2h9v12.5L8 11l-4.5 3.5V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M4 2l10 6-10 6V2z" fill="currentColor" />
  </svg>
);

export const SeminarCard: React.FC<SeminarCardProps> = ({
  seminar,
  onBookmarkChanged,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const t = useI18n();

  const [isSaved, setIsSaved] = useState(Boolean(seminar.isSaved));
  const [saving, setSaving] = useState(false);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || saving) return;

    setSaving(true);
    try {
      const res = await seminarsApi.toggleBookmark(seminar.id);
      setIsSaved(res.isSaved);
      if (onBookmarkChanged) {
        onBookmarkChanged(seminar.id, res.isSaved);
      }
    } catch {}
    finally {
      setSaving(false);
    }
  };

  const isLive = seminar.isLive || seminar.status === SeminarStatus.LIVE;

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.5s infinite' }} />
          {t('Live Now')}
        </span>
      );
    }
    switch (seminar.status) {
      case SeminarStatus.SCHEDULED:
        return <span className="badge badge-blue">{t('Scheduled')}</span>;
      case SeminarStatus.COMPLETED:
        return <span className="badge badge-slate">{t('Completed')}</span>;
      default:
        return <span className="badge badge-slate">{t('Draft Seminars')}</span>;
    }
  };

  const authorName = seminar.author?.fio || seminar.author?.username || 'OKMK Xodimi';
  const initials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'O';

  const hasDownloadableFiles = seminar.files && seminar.files.length > 0 && seminar.files.some(f => f.canDownload !== false);

  return (
    <div
      className={`card ${isLive ? 'live-glow' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onClick={() => {
        if (isLive) navigate(`/live/${seminar.id}`);
        else navigate(`/seminars/${seminar.id}`);
      }}
    >
      {/* Card Header — Status left, Bookmark top-right */}
      <div className="card-header" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div>{getStatusBadge()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Download button if files available */}
          {hasDownloadableFiles && (
            <button
              type="button"
              className="btn-icon"
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                width: 28,
                height: 28,
                borderRadius: 'var(--r-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/seminars/${seminar.id}#files`);
              }}
              title="Fayllarni yuklab olish"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.color = 'var(--blue, #3b82f6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <DownloadIcon />
            </button>
          )}

          {/* Bookmark — top right */}
          {isAuthenticated && (
            <button
              type="button"
              className="btn-icon"
              style={{
                background: isSaved ? 'var(--blue-lt, rgba(59,130,246,0.12))' : 'transparent',
                color: isSaved ? 'var(--blue, #3b82f6)' : 'var(--text-muted)',
                width: 28,
                height: 28,
                borderRadius: 'var(--r-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={handleToggleBookmark}
              title={isSaved ? "Saqlanganlardan o'chirish" : "Saqlab qo'yish"}
              disabled={saving}
              onMouseEnter={(e) => {
                if (!isSaved) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                  e.currentTarget.style.color = 'var(--blue, #3b82f6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaved) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <BookmarkIcon filled={isSaved} />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body" style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--f-ui)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-pri)',
            lineHeight: 1.35,
            marginBottom: 8,
          }}
        >
          {seminar.title}
        </div>

        {seminar.description && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-sec)',
              lineHeight: 1.4,
              marginBottom: 12,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {seminar.description}
          </p>
        )}

        {/* Author & Dept */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--blue-lt)',
              color: 'var(--blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--f-disp)',
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-pri)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {authorName}
            </div>
            {seminar.department && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{seminar.department.name}</div>
            )}
          </div>
        </div>

        {/* Footer — Metrics left, View button right */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 10,
          paddingTop: 8,
        }}>
          {/* Metrics — bottom left */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--f-mono)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <EyeIcon /> {seminar.viewCount || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <HeartIcon /> {seminar.likesCount || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <CommentIcon /> {seminar.commentsCount || 0}
            </span>
          </div>

          {/* View button — bottom right */}
          <button
            type="button"
            className={`btn ${isLive ? 'btn-danger' : 'btn-ghost'} btn-sm`}
            style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <PlayIcon />
            {isLive ? t('Join Live') : t('Watch Recording')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeminarCard;
