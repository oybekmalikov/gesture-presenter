// src/components/dashboard/PublicDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, seminarsApi } from '../../services/api';
import { GuestDashboardData, Seminar, Tag } from '../../types';
import { StatCard } from './StatCard';
import { PresentationGrid8 } from './PresentationGrid8';
import { useI18n } from '../../utils/i18n';

export const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const t = useI18n();

  const [data, setData] = useState<GuestDashboardData | null>(null);
  const [recentSeminars, setRecentSeminars] = useState<Seminar[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [dashRes, semRes] = await Promise.all([
          dashboardApi.getGuestDashboard(),
          seminarsApi.findAll({ limit: 12 }),
        ]);

        if (mounted) {
          setData(dashRes);
          if (semRes?.items) {
            setRecentSeminars(semRes.items);
          }
          if (dashRes?.popularTags) {
            setPopularTags(dashRes.popularTags);
          }
        }
      } catch {}
      finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page active" id="page-dashboard">
      {/* Top Stats Strip */}
      <div className="stats-strip">
        <StatCard
          title={t('Total Seminars')}
          value={data?.summary?.publicSeminarsCount || recentSeminars.length}
          meta="Barcha ochiq va ilmiy taqdimotlar"
          colorClass="sc-blue"
          onClick={() => navigate('/seminars')}
        />
        <StatCard
          title={t('Live Streams')}
          value={data?.summary?.liveSeminarsCount || 0}
          meta="Hozir o'tkazilayotgan jonli seminarlar"
          colorClass="sc-red"
          onClick={() => navigate('/live')}
        />
        <StatCard
          title="Ommabop Teglar"
          value={popularTags.length}
          meta="Yo'nalishlar va mavzular"
          colorClass="sc-amber"
        />
        <StatCard
          title="Korxona tarmog'i"
          value="OKMK"
          meta="Ichki korporativ xavfsiz tizim"
          colorClass="sc-green"
        />
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* 8-Card Presentation Grid (Live + Recent) */}
        <PresentationGrid8
          seminars={recentSeminars.length > 0 ? recentSeminars : (data?.topTrending || [])}
          loading={loading}
        />

        {/* Popular Categories / Tags Card */}
        <div className="card" style={{ gridColumn: 'span 7' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Popular Tags')}</div>
              <div className="card-subtitle">Eng ko'p taqdimot tayyorlangan sohalar</div>
            </div>
          </div>
          <div className="card-body">
            {popularTags.length === 0 ? (
              <div className="empty-state">{t('No records found')}</div>
            ) : (
              <div className="tags-cloud-wrap">
                {popularTags.map((tag) => (
                  <button
                    key={tag.id || tag.name}
                    type="button"
                    className="tag-chip"
                    onClick={() => navigate(`/seminars?tag=${encodeURIComponent(tag.name)}`)}
                  >
                    <span>#{tag.name}</span>
                    {tag.count !== undefined && <span className="tag-chip-count">({tag.count})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Corporate Sign In Promotion Card */}
        <div className="card" style={{ gridColumn: 'span 5' }}>
          <div className="card-header">
            <div>
              <div className="card-title">OKMK Xodimlari uchun</div>
              <div className="card-subtitle">Yopiq tizimga kirish imkoniyati</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', margin: 0, lineHeight: 1.5 }}>
              O'z seminarlaringizni yaratish, jonli efirlarda qatnashish, layk va izohlar qoldirish uchun korporativ login orqali kiring.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => navigate('/login')}
              >
                {t('Sign In')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;
