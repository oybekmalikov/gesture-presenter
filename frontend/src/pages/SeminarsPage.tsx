// src/pages/SeminarsPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { seminarsApi } from '../services/api';
import { Seminar, QuerySeminarParams, Tag } from '../types';
import { SeminarCard } from '../components/seminars/SeminarCard';
import { CreateSeminarModal } from '../components/seminars/CreateSeminarModal';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';

export const SeminarsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isSuperadmin } = useAuth();
  const t = useI18n();

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    searchParams.get('new') === '1',
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentTab = searchParams.get('tab') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentSort = (searchParams.get('sortBy') as any) || 'latest';
  const currentPage = Number(searchParams.get('page')) || 1;
  const currentDept = searchParams.get('departmentId') || '';

  const loadSeminars = async () => {
    setLoading(true);
    try {
      const params: QuerySeminarParams = {
        page: currentPage,
        limit: 12,
        search: currentSearch || undefined,
        tag: currentTag || undefined,
        tab: (currentTab as any) !== 'all' ? (currentTab as any) : undefined,
        sortBy: currentSort,
        departmentId: currentDept || undefined,
      };
      const res = await seminarsApi.findAll(params);
      if (res?.items) {
        setSeminars(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeminars();
  }, [currentTab, currentSearch, currentTag, currentSort, currentPage, currentDept]);

  useEffect(() => {
    seminarsApi
      .getPopularTags()
      .then((tags) => {
        if (Array.isArray(tags)) setPopularTags(tags);
      })
      .catch(() => {});
  }, []);

  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'all') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleTagFilter = (tagName: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (currentTag === tagName) {
      newParams.delete('tag');
    } else {
      newParams.set('tag', tagName);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (sortBy: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', sortBy);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (p: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(p));
    setSearchParams(newParams);
  };

  const hasFilters = currentSearch || currentTab !== 'all' || currentTag || currentDept;

  return (
    <div className="page active" id="page-seminars">
      {/* Header */}
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('Seminars')}</div>
          <div className="pg-sub">
            OKMK korporativ ilmiy-amaliy va texnologik taqdimotlar bazasi · {total} ta seminar
          </div>
        </div>
        {isAuthenticated && !isSuperadmin && (
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + {t('Create Seminar')}
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar admin-filter-bar" style={{ flexWrap: 'wrap' }}>
        {/* Main search */}
        <div style={{ position: 'relative', flex: '1 1 250px', minWidth: 200 }}>
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="none"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            className="f-input"
            style={{ paddingLeft: 32 }}
            value={currentSearch}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              if (e.target.value) newParams.set('search', e.target.value);
              else newParams.delete('search');
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
            placeholder="Mavzu, muallif yoki kalit so'z bo'yicha qidiruv..."
          />
        </div>

        <select
          className="f-select"
          value={currentTab}
          onChange={(e) => handleTabChange(e.target.value)}
        >
          <option value="all">Barcha taqdimotlar</option>
          <option value="live">Jonli efirdagilar</option>
          <option value="scheduled">Rejalashtirilgan</option>
          <option value="completed">Yakunlangan</option>
          {isAuthenticated && <option value="my">Mening seminarlarim</option>}
          {isAuthenticated && <option value="department">Bo'limim seminarlari</option>}
        </select>

        <select
          className="f-select"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="latest">Eng yangilari</option>
          <option value="popular">Eng ko'p ko'rilgan</option>
          <option value="likes">Eng ko'p layk</option>
          <option value="comments">Eng ko'p komment</option>
          <option value="saved">Eng ko'p saqlangan</option>
          <option value="views">Ko'rishlar bo'yicha</option>
        </select>

        {/* Advanced Search Toggle */}
        <button
          type="button"
          className={`btn ${showAdvanced ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Kengaytirilgan qidiruv
        </button>

        {hasFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchParams(new URLSearchParams());
              setShowAdvanced(false);
            }}
            style={{ color: 'var(--danger, #ef4444)' }}
          >
            {t('Reset filters')}
          </button>
        )}
      </div>

      {/* Advanced Search Panel */}
      {showAdvanced && (
        <div
          style={{
            margin: '0 24px 16px',
            padding: '16px 18px',
            background: 'var(--bg-surface, #111827)',
            border: '1.5px solid var(--border, #1e293b)',
            borderRadius: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            animation: 'confirmSlideUp 0.2s ease-out',
          }}
        >
          <div>
            <label style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
              display: 'block',
              fontFamily: 'var(--f-mono)',
            }}>
              Bo'lim bo'yicha
            </label>
            <input
              className="f-input"
              placeholder="Bo'lim nomi..."
              value={currentDept}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) newParams.set('departmentId', e.target.value);
                else newParams.delete('departmentId');
                newParams.set('page', '1');
                setSearchParams(newParams);
              }}
            />
          </div>
          <div>
            <label style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
              display: 'block',
              fontFamily: 'var(--f-mono)',
            }}>
              Teg bo'yicha
            </label>
            <input
              className="f-input"
              placeholder="#tag..."
              value={currentTag}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) newParams.set('tag', e.target.value);
                else newParams.delete('tag');
                newParams.set('page', '1');
                setSearchParams(newParams);
              }}
            />
          </div>
        </div>
      )}

      {/* Tags strip */}
      {popularTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0 24px 16px', padding: 0 }}>
          {popularTags.map((tag) => (
            <button
              key={tag.id || tag.name}
              type="button"
              className={`tag-chip ${currentTag === tag.name ? 'active' : ''}`}
              onClick={() => handleTagFilter(tag.name)}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Seminars */}
      <div className="admin-page-body">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            {t('Loading')}
          </div>
        ) : seminars.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div className="empty-state">Qidiruv bo'yicha seminarlar topilmadi</div>
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
              <SeminarCard key={seminar.id} seminar={seminar} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            flexWrap: 'wrap',
          }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ← Oldingi
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ minWidth: 32, padding: '4px 8px' }}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Keyingi →
            </button>
          </div>
        )}
      </div>

      {/* Create Seminar Modal */}
      {isCreateModalOpen && (
        <CreateSeminarModal
          onClose={() => {
            setIsCreateModalOpen(false);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('new');
            setSearchParams(newParams);
          }}
          onCreated={() => {
            setIsCreateModalOpen(false);
            loadSeminars();
          }}
        />
      )}

      <style>{`
        @keyframes confirmSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SeminarsPage;
