import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seminarsApi, liveApi } from '../services/api';
import { Seminar, SeminarStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../utils/i18n';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CreateSeminarModal } from '../components/seminars/CreateSeminarModal';
import { EditSeminarModal } from '../components/seminars/EditSeminarModal';
import { LockOpen, Lock, Image, Video, SquareArrowOutUpRight, Pen, Trash2 } from 'lucide-react';

export const MySeminarsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const t = useI18n();

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartLive = async (seminarId: string) => {
    try {
      await liveApi.startSession(seminarId);
      toast.success("Jonli efir boshlandi");
    } catch { }
    navigate(`/live/${seminarId}`);
  };

  const loadMySeminars = async () => {
    setLoading(true);
    try {
      const res = await seminarsApi.findAll({ tab: 'my', limit: 100 });
      if (res?.items) {
        setSeminars(res.items);
      }
    } catch { }
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
      toast.success("Seminar muvaffaqiyatli o'chirildi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Seminarni o'chirishda xatolik");
    } finally {
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
                Hozircha sizda taqdimotlar yo'q.<br /><br />
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
                      <th>Ochiqlik</th>
                      <th>Holat</th>
                      <th>Sana</th>
                      <th>Ko'rishlar</th>
                      <th style={{ textAlign: 'right' }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seminars.map((sem) => (
                      <tr key={sem.id}>
                        <td style={{ fontWeight: 600, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {sem.coverImageUrl ? (
                              <img
                                src={sem.coverImageUrl}
                                alt=""
                                style={{ width: 36, height: 24, borderRadius: 4, objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{ fontSize: 16 }}><Image /></span>
                            )}
                            <span title={sem.title}>{sem.title}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${sem.fileAccess === 'public' ? 'badge-blue' : 'badge-slate'}`} style={{ fontSize: 10 }}>
                            {sem.fileAccess === 'public' ? `${<LockOpen />} Ochiq` : `${<Lock />} Tanlangan`}
                          </span>
                        </td>
                        <td>{getStatusBadge(sem.status, sem.isLive)}</td>
                        <td style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>
                          {sem.scheduledAt ? new Date(sem.scheduledAt).toLocaleString() : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--f-mono)' }}>{sem.viewCount || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {sem.isLive || sem.status === SeminarStatus.LIVE ? (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                style={{ animation: 'pulse 1.5s infinite' }}
                                onClick={() => navigate(`/live/${sem.id}`)}
                              >
                                🔴 Efirda
                              </button>
                            ) : sem.status === SeminarStatus.COMPLETED || sem.isRecorded ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/seminars/${sem.id}`)}
                              >
                                <Video /> Yozuv
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                  border: '1px solid #b91c1c',
                                }}
                                onClick={() => handleStartLive(sem.id)}
                              >
                                🔴 Efirni boshlash
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/seminars/${sem.id}`)}
                            >
                              <SquareArrowOutUpRight />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--blue)' }}
                              onClick={() => setEditingSeminar(sem)}
                            >
                              <Pen />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger, #ef4444)' }}
                              onClick={() => setDeleteId(sem.id)}
                            >
                              <Trash2 />
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

      {editingSeminar && (
        <EditSeminarModal
          seminar={editingSeminar}
          onClose={() => setEditingSeminar(null)}
          onUpdated={() => {
            setEditingSeminar(null);
            loadMySeminars();
          }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          open={true}
          title="Seminarni o'chirish"
          message="Haqiqatan ham ushbu seminarni va unga tegishli barcha fayllarni o'chirib tashlamoqchimisiz?"
          confirmText="O'chirish"
          cancelText="Bekor qilish"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default MySeminarsPage;
