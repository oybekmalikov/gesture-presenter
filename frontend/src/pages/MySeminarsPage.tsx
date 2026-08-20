// src/pages/MySeminarsPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seminarsApi } from '../services/api';
import { Seminar, SeminarStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CreateSeminarModal } from '../components/seminars/CreateSeminarModal';

export const MySeminarsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useI18n();

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMySeminars = async () => {
    setLoading(true);
    try {
      const res = await seminarsApi.findAll({ tab: 'my', limit: 100 });
      if (res?.items) {
        setSeminars(res.items);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMySeminars();
  }, []);

  const handleDelete = async () => {
    if (!deleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      await seminarsApi.remove(deleteId);
      setSeminars((prev) => prev.filter((s) => s.id !== deleteId));
    } catch {}
    finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: SeminarStatus, isLive: boolean) => {
    if (isLive) return <span className="badge badge-red">Jonli efirda</span>;
    switch (status) {
      case SeminarStatus.SCHEDULED: return <span className="badge badge-amber">Rejalashtirilgan</span>;
      case SeminarStatus.COMPLETED: return <span className="badge badge-green">Yakunlangan</span>;
      default: return <span className="badge badge-slate">Qoralama</span>;
    }
  };

  return (
    <div className="page active" id="page-my-seminars">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('My Seminars')}</div>
          <div className="pg-sub">Siz yaratgan va boshqaradigan barcha seminarlar va taqdimotlar</div>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsCreateOpen(true)}
          >
            + {t('Create Seminar')}
          </button>
        </div>
      </div>

      <div className="main-grid">
        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-body">
            {loading ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>{t('Loading')}</div>
            ) : seminars.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 0' }}>
                Hozircha sizda taqdimotlar yo'q.<br/><br/>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Yaratish
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="tbl admin-table">
                  <thead>
                    <tr>
                      <th>Sarlavha</th>
                      <th>Holat</th>
                      <th>Sana</th>
                      <th>Ko'rishlar</th>
                      <th style={{ textAlign: 'right' }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seminars.map((sem) => (
                      <tr key={sem.id}>
                        <td style={{ fontWeight: 600, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sem.title}
                        </td>
                        <td>{getStatusBadge(sem.status, sem.isLive)}</td>
                        <td style={{ fontFamily: 'var(--f-mono)' }}>
                          {sem.scheduledAt ? new Date(sem.scheduledAt).toLocaleString() : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--f-mono)' }}>{sem.viewCount || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                if (sem.isLive || sem.status === SeminarStatus.LIVE) {
                                  navigate(`/live/${sem.id}`);
                                } else {
                                  navigate(`/seminars/${sem.id}`);
                                }
                              }}
                            >
                              Ochish
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger, #ef4444)' }}
                              onClick={() => setDeleteId(sem.id)}
                            >
                              O'chirish
                            </button>
                          </div>
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

      {isCreateOpen && (
        <CreateSeminarModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setIsCreateOpen(false);
            loadMySeminars();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteId}
        title="Seminarni o'chirish"
        message="Haqiqatan ham bu seminarni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText={isDeleting ? 'O\'chirilmoqda...' : 'Ha, o\'chirish'}
        cancelText="Bekor qilish"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteId(null);
        }}
      />
    </div>
  );
};

export default MySeminarsPage;
