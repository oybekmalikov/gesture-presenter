import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seminarsApi } from '../services/api';
import { Seminar } from '../types';
import { SeminarCard } from '../components/seminars/SeminarCard';
import { useI18n } from '../utils/i18n';
import { ArrowRight, ChevronRight, SquareOff } from 'lucide-react';

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const t = useI18n();

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const res = await seminarsApi.getBookmarks(1, 24);
      if (res?.items) {
        setSeminars(res.items);
        setTotal(res.total);
      }
    } catch { }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleBookmarkRemoved = (id: string, isSaved: boolean) => {
    if (!isSaved) {
      setSeminars((prev) => prev.filter((s) => s.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="page active" id="page-bookmarks">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('Bookmarks')}</div>
          <div className="pg-sub">
            Siz saqlab qo'ygan taqdimotlar to'plami · {total} ta saqlangan
          </div>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/seminars')}
          >
            Barcha seminarlar <ChevronRight />
          </button>
        </div>
      </div>

      <div className="admin-page-body">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            {t('Loading')}
          </div>
        ) : seminars.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div className="empty-state">
              <SquareOff /> Hozircha saqlangan seminarlar mavjud emas. Taqdimotlar kartasidagi belgi orqali saqlab qo'yishingiz mumkin.
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/seminars')}
              >
                Seminarlar katalogiga o'tish <ChevronRight />
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {seminars.map((seminar) => (
              <SeminarCard
                key={seminar.id}
                seminar={{ ...seminar, isSaved: true }}
                onBookmarkChanged={handleBookmarkRemoved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;
