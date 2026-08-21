import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seminarsApi, liveApi } from '../services/api';
import { Seminar, SeminarStatus } from '../types';
import { SeminarCard } from '../components/seminars/SeminarCard';
import { CreateSeminarModal } from '../components/seminars/CreateSeminarModal';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';
import { RadioOff, Video } from 'lucide-react';

export const LiveStreamsPage: React.FC = () => {
  const { user, isAuthenticated, isSuperadmin } = useAuth();
  const navigate = useNavigate();
  const t = useI18n();

  const [activeLiveSeminars, setActiveLiveSeminars] = useState<Seminar[]>([]);
  const [scheduledLiveSeminars, setScheduledLiveSeminars] = useState<Seminar[]>([]);
  const [pastRecordings, setPastRecordings] = useState<Seminar[]>([]);
  const [mySeminars, setMySeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [liveRes, schedRes, pastRes, myRes] = await Promise.all([
        seminarsApi.findAll({ tab: 'live', limit: 20 }),
        seminarsApi.findAll({ tab: 'scheduled', limit: 20 }),
        seminarsApi.findAll({ tab: 'completed', limit: 20 }),
        isAuthenticated ? seminarsApi.findAll({ tab: 'my', limit: 10 }) : Promise.resolve({ items: [] } as any),
      ]);

      if (liveRes?.items) {
        setActiveLiveSeminars(liveRes.items.filter((s) => s.isLive || s.status === SeminarStatus.LIVE));
      }
      if (schedRes?.items) {
        setScheduledLiveSeminars(schedRes.items.filter((s) => !s.isLive && s.status === SeminarStatus.SCHEDULED));
      }
      if (pastRes?.items) {
        setPastRecordings(pastRes.items.filter((s) => s.isRecorded || s.status === SeminarStatus.COMPLETED));
      }
      if (myRes?.items) {
        setMySeminars(myRes.items);
      }
    } catch { }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') loadData();
    }, 15000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleStartLive = async (seminarId: string) => {
    try {
      await liveApi.startSession(seminarId);
    } catch { }
    navigate(`/live/${seminarId}`);
  };

  return (
    <div className="page active" id="page-live-streams">
      <div className="page-hd">
        <div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{t('Live Sessions')}</span>
            {activeLiveSeminars.length > 0 && (
              <span
                className="badge badge-red"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  padding: '4px 10px',
                  animation: 'pulse 1.5s infinite',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
                {activeLiveSeminars.length} ta efir jonli
              </span>
            )}
          </div>
          <div className="pg-sub">
            OKMK korporativ jonli videokonferensiyalari, interaktiv taqdimotlar va yozib olingan efirlar
          </div>
        </div>

        {isAuthenticated && !isSuperadmin && (
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: '1px solid #b91c1c',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              }}
              onClick={() => setIsCreateOpen(true)}
            >
              🔴 + Yangi jonli seminar yaratish
            </button>
          </div>
        )}
      </div>

      <div className="main-grid">
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header" style={{ background: 'rgba(239, 68, 68, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse 1.2s infinite',
                }}
              />
              <div>
                <div className="card-title" style={{ color: '#ef4444' }}>
                  Hozir jonli efirdagi seminarlar ({activeLiveSeminars.length})
                </div>
                <div className="card-subtitle">
                  To'g'ridan-to'g'ri ulanish va video/audio orqali qatnashish
                </div>
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>{t('Loading')}</div>
            ) : activeLiveSeminars.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-raised)',
                  borderRadius: 'var(--r-lg)',
                  border: '1px dashed var(--border)',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}><RadioOff /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-pri)', marginBottom: 4 }}>
                  Hozirda faol jonli efir mavjud emas
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 16px' }}>
                  Rejalashtirilgan seminarlardan birini boshlashingiz yoki yangi jonli seminar yaratishingiz mumkin.
                </div>
                {isAuthenticated && mySeminars.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/my-seminars')}
                  >
                    Mening seminarlarimdan efir boshlash →
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 16,
                }}
              >
                {activeLiveSeminars.map((sem) => (
                  <SeminarCard key={sem.id} seminar={sem} />
                ))}
              </div>
            )}
          </div>
        </div>

        {isAuthenticated && mySeminars.filter((s) => !s.isLive && s.status !== SeminarStatus.COMPLETED && !s.isRecorded).length > 0 && (
          <div className="card" style={{ gridColumn: 'span 12' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Sizning tayyor seminarlaringiz (Efirni boshlash)</div>
                <div className="card-subtitle">Taqdimotni bir klik bilan jonli efirga uzatish</div>
              </div>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                {mySeminars
                  .filter((s) => !s.isLive && s.status !== SeminarStatus.COMPLETED && !s.isRecorded)
                  .map((sem) => (
                    <div
                      key={sem.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--r-lg)',
                        background: 'var(--bg-raised)',
                        border: '1.5px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-pri)', marginBottom: 4 }}>
                          {sem.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {sem.scheduledAt ? new Date(sem.scheduledAt).toLocaleString() : 'Vaqti belgilanmagan'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            border: '1px solid #b91c1c',
                          }}
                          onClick={() => handleStartLive(sem.id)}
                        >
                          🔴 Efirni boshlash
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/seminars/${sem.id}`)}
                        >
                          Ko'rish
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {scheduledLiveSeminars.length > 0 && (
          <div className="card" style={{ gridColumn: 'span 12' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Yaqin soatlarda kutilayotgan seminarlar ({scheduledLiveSeminars.length})</div>
                <div className="card-subtitle">Vaqti yetganda avtomatik jonli efir boshlanadi</div>
              </div>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {scheduledLiveSeminars.map((sem) => (
                  <SeminarCard key={sem.id} seminar={sem} />
                ))}
              </div>
            </div>
          </div>
        )}

        {pastRecordings.length > 0 && (
          <div className="card" style={{ gridColumn: 'span 12' }}>
            <div className="card-header">
              <div>
                <div className="card-title"><Video /> Yozib olingan jonli efirlar arxivi ({pastRecordings.length})</div>
                <div className="card-subtitle">O'tkazilgan seminarlar video yozuvlari va materiallari</div>
              </div>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {pastRecordings.map((sem) => (
                  <SeminarCard key={sem.id} seminar={sem} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateSeminarModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newSem) => {
            setIsCreateOpen(false);
            loadData();
            if (newSem?.id) {
              navigate(`/seminars/${newSem.id}`);
            }
          }}
        />
      )}
    </div>
  );
};

export default LiveStreamsPage;
