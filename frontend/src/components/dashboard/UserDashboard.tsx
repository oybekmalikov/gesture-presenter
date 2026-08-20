// src/components/dashboard/UserDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, seminarsApi } from '../../services/api';
import { UserDashboardData, Seminar, SeminarStatus } from '../../types';
import { StatCard } from './StatCard';
import { PresentationGrid8 } from './PresentationGrid8';
import { UnwatchedSeminarsSidebar } from './UnwatchedSeminarsSidebar';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../utils/i18n';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useI18n();

  const [data, setData] = useState<UserDashboardData | null>(null);
  const [allSeminars, setAllSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [dashData, sList] = await Promise.all([
          dashboardApi.getUserDashboard(),
          seminarsApi.findAll({ limit: 16 }),
        ]);

        if (mounted) {
          setData(dashData);
          if (sList?.items) {
            setAllSeminars(sList.items);
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

  const mySeminarsCount = data?.kpi?.mySeminarsCount || 0;
  const myLikes = data?.kpi?.myLikesReceived || 0;
  const mySaved = data?.kpi?.mySavedCount || 0;
  const assignedList = data?.assignedForMe || [];
  const deptList = data?.departmentRecent || [];
  const liveSeminars = data?.liveSeminars || [];

  // Computed KPI values
  const todaySeminars = allSeminars.filter(s => {
    if (!s.scheduledAt) return false;
    const d = new Date(s.scheduledAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const liveCount = allSeminars.filter(s => s.isLive || s.status === SeminarStatus.LIVE).length;

  const myScheduled = allSeminars.filter(s =>
    s.authorId === user?.id && s.status === SeminarStatus.SCHEDULED
  ).length;


  return (
    <div className="page active" id="page-dashboard">
      {/* Top Stats Strip — 6 ta KPI karta */}
      <div className="stats-strip">
        <StatCard
          title={t('My Seminars')}
          value={mySeminarsCount}
          meta="Shaxsiy yaratilgan taqdimotlar"
          colorClass="sc-blue"
          onClick={() => navigate('/my-seminars')}
        />
        <StatCard
          title="Bugungi seminarlar"
          value={todaySeminars}
          meta="Bugunga rejalashtirilgan"
          colorClass="sc-green"
        />
        <StatCard
          title="Biriktirilgan"
          value={assignedList.length}
          meta="Siz ko'rishingiz mo'ljallangan"
          colorClass="sc-amber"
        />
        <StatCard
          title="Hozir jonli"
          value={liveCount}
          meta="Jonli efirlar soni"
          colorClass="sc-red"
          icon={liveCount > 0 ? (
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'pulse 1.5s infinite',
              boxShadow: '0 0 6px rgba(239,68,68,0.5)',
            }} />
          ) : undefined}
        />
        <StatCard
          title={t('Saved Seminars')}
          value={mySaved}
          meta="Saqlab qo'yilgan seminarlar"
          colorClass="sc-slate"
          onClick={() => navigate('/bookmarks')}
        />
        <StatCard
          title="Rejalashtirganlarim"
          value={myScheduled}
          meta="Men rejalashtirgan seminarlar"
          colorClass="sc-blue"
          onClick={() => navigate('/seminars?tab=my&sortBy=latest')}
        />
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* 8-Item Presentation Grid — Left */}
        <div style={{ gridColumn: 'span 8' }}>
          <PresentationGrid8
            seminars={allSeminars.length > 0 ? allSeminars : liveSeminars}
            loading={loading}
          />
        </div>
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Unwatched Seminars Component */}
          <UnwatchedSeminarsSidebar />
        </div>

        {/* Assigned For Me Card */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Assigned to Me')}</div>
              <div className="card-subtitle">Sizga yo'naltirilgan seminarlar va hisobotlar</div>
            </div>
          </div>
          <div className="card-body">
            {assignedList.length === 0 ? (
              <div className="empty-state">Hozircha sizga biriktirilgan taqdimotlar yo'q</div>
            ) : (
              <div className="table-wrap">
                <table className="tbl admin-table">
                  <thead>
                    <tr>
                      <th>Seminar</th>
                      <th>Ma'ruzachi</th>
                      <th>Sana</th>
                      <th>Amal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedList.map((sem) => (
                      <tr key={sem.id}>
                        <td style={{ fontWeight: 600 }}>{sem.title}</td>
                        <td>{sem.author?.fio || sem.author?.username || '—'}</td>
                        <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                          {sem.scheduledAt ? new Date(sem.scheduledAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/seminars/${sem.id}`)}
                          >
                            Ochish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Department Seminars Card */}
        <div className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card-header">
            <div>
              <div className="card-title">{t('Recent Department Seminars')}</div>
              <div className="card-subtitle">
                {user?.department?.name || "O'z bo'limingiz"} yangiliklari
              </div>
            </div>
            <div className="card-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/seminars?tab=department')}
              >
                Bo'lim arxivi →
              </button>
            </div>
          </div>
          <div className="card-body">
            {deptList.length === 0 ? (
              <div className="empty-state">Bo'limda yangi seminarlar yo'q</div>
            ) : (
              <div className="table-wrap">
                <table className="tbl admin-table">
                  <thead>
                    <tr>
                      <th>Mavzu</th>
                      <th>Muallif</th>
                      <th>Ko'rishlar</th>
                      <th>Amal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptList.map((sem) => (
                      <tr key={sem.id}>
                        <td style={{ fontWeight: 600 }}>{sem.title}</td>
                        <td>{sem.author?.fio || sem.author?.username || '—'}</td>
                        <td style={{ fontFamily: 'var(--f-mono)' }}>{sem.viewCount || 0}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/seminars/${sem.id}`)}
                          >
                            Ko'rish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
