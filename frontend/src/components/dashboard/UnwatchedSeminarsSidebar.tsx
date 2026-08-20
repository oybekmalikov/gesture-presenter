import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seminarsApi } from '../../services/api';
import { Seminar, SeminarStatus } from '../../types';

export const UnwatchedSeminarsSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [unwatchedSeminars, setUnwatchedSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSeminars = async () => {
      try {
        const res = await seminarsApi.findAll({ limit: 16 });
        if (mounted && res?.items) {
          const unwatched = res.items
            .filter((s: Seminar) => s.status === SeminarStatus.COMPLETED && s.viewCount === 0)
            .slice(0, 8);
          setUnwatchedSeminars(unwatched);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSeminars();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Ko'rmagan seminarlarim</div>
        </div>
        <div className="card-body" style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ gridRow: 'span 2' }}>
      <div className="card-header" style={{ paddingBottom: 10 }}>
        <div>
          <div className="card-title" style={{ fontSize: 13 }}>Ko'rmagan seminarlarim</div>
          <div className="card-subtitle" style={{ fontSize: 10 }}>O'tkazib yuborilgan</div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--f-mono)',
            color: '#fff',
            background: 'var(--blue, #3b82f6)',
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          {unwatchedSeminars.length}
        </span>
      </div>
      <div className="card-body" style={{
        padding: '8px 12px',
        maxHeight: 450,
        overflowY: 'auto',
      }}>
        {unwatchedSeminars.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0', fontSize: 12 }}>
            Barcha seminarlarni ko'rib chiqdingiz 👏
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unwatchedSeminars.map((sem) => {
              const authorName = sem.author?.fio || sem.author?.username || 'OKMK Xodimi';
              const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div
                  key={sem.id}
                  onClick={() => navigate(`/seminars/${sem.id}`)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--bg-surface-2, #0f172a)',
                    border: '1px solid var(--border, #1e293b)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                    e.currentTarget.style.background = 'rgba(59,130,246,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border, #1e293b)';
                    e.currentTarget.style.background = 'var(--bg-surface-2, #0f172a)';
                  }}
                >
                  {/* Thumbnail / Icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'var(--blue-lt, rgba(59,130,246,0.1))',
                    border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3H4a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1V4a1 1 0 00-1-1h-2" stroke="var(--blue, #3b82f6)" strokeWidth="1.3" />
                      <rect x="6" y="1.5" width="4" height="3" rx="1" stroke="var(--blue, #3b82f6)" strokeWidth="1.3" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-pri, #fff)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 2,
                    }}>
                      {sem.title}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--f-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'var(--blue-lt)',
                        color: 'var(--blue)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 7,
                        fontWeight: 700,
                      }}>
                        {initials}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {authorName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
