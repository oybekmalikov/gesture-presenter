import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  seminarsApi,
  interactionsApi,
  filesApi,
  liveApi,
} from '../services/api';
import { Seminar, SeminarFile, CommentItem, SeminarStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThreeDViewer } from '../components/ThreeDViewer';
import { InteractivePresentation } from '../components/InteractivePresentation';
import { EditSeminarModal } from '../components/seminars/EditSeminarModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useI18n } from '../utils/i18n';
import { Bookmark, BookmarkCheck, MonitorX, Pen, Send, SendIcon, ThumbsUp } from 'lucide-react';

export const SeminarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user, isAdmin, isSuperadmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const t = useI18n();

  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  const [activeViewerFile, setActiveViewerFile] = useState<SeminarFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [startingLive, setStartingLive] = useState(false);

  const isAuthor = Boolean(
    isAuthenticated && user?.id && (seminar?.authorId === user?.id || seminar?.author?.id === user?.id),
  );
  const isCompleted = Boolean(
    seminar?.status === SeminarStatus.COMPLETED || seminar?.isRecorded,
  );

  const handleStartLive = async () => {
    if (!seminar) return;
    setStartingLive(true);
    try {
      await liveApi.startSession(seminar.id);
      toast.success("Jonli efir boshlandi!");
    } catch { }
    finally {
      setStartingLive(false);
      navigate(`/live/${seminar.id}`);
    }
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [semRes, commRes] = await Promise.all([
        seminarsApi.findOne(id),
        interactionsApi.getComments(id),
      ]);
      setSeminar(semRes);
      setLikeCount(semRes.likesCount || 0);
      setIsLiked(Boolean(semRes.isLiked));
      setIsSaved(Boolean(semRes.isSaved));
      setComments(commRes || []);

      // Auto-select first viewable presentation, 3D file or video recording
      if (semRes.files && semRes.files.length > 0) {
        const defaultFile =
          semRes.files.find(
            (f) =>
              f.fileType === 'pdf' ||
              f.fileType === '3d' ||
              f.fileType === 'video' ||
              f.fileType === 'presentation',
          ) || semRes.files[0];
        setActiveViewerFile(defaultFile);
      }
    } catch { }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleLike = async () => {
    if (!id || !isAuthenticated) return;
    try {
      const res = await interactionsApi.toggleLike(id);
      setIsLiked(res.liked);
      setLikeCount(res.likesCount);
      toast.success(res.liked ? "Taqdimotga layk bosildi" : "Layk bekor qilindi");
    } catch { }
  };

  const handleToggleBookmark = async () => {
    if (!id || !isAuthenticated) return;
    try {
      const res = await seminarsApi.toggleBookmark(id);
      setIsSaved(res.isSaved);
      toast.success(res.isSaved ? "Seminar saqlab qo'yildi" : "Saqlanganlardan olib tashlandi");
    } catch { }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentInput.trim() || !isAuthenticated) return;

    try {
      await interactionsApi.addComment(
        id,
        commentInput.trim(),
        replyParentId || undefined,
      );
      setCommentInput('');
      setReplyParentId(null);
      const updatedComments = await interactionsApi.getComments(id);
      setComments(updatedComments || []);
      toast.success("Izohingiz qo'shildi");
    } catch { }
  };

  const handleDeleteCommentConfirm = async () => {
    if (!deleteCommentId) return;
    try {
      await interactionsApi.removeComment(deleteCommentId);
      if (id) {
        const updated = await interactionsApi.getComments(id);
        setComments(updated || []);
      }
      toast.success("Izoh o'chirildi");
    } catch { }
    finally {
      setDeleteCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="page active">
        <div className="empty-state" style={{ padding: '80px 0' }}>
          {t('Loading')}
        </div>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="page active">
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div className="empty-state">Seminar topilmadi yoki unga kirish cheklangan</div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/seminars')}
          >
            Seminarlar ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  const is3DActive =
    activeViewerFile?.fileType === '3d' ||
    activeViewerFile?.originalName?.match(/\.(step|stp|glb|gltf)$/i);

  const isVideoActive =
    activeViewerFile?.fileType === 'video' ||
    activeViewerFile?.originalName?.match(/\.(mp4|webm|mkv|mov)$/i);

  const isLive = seminar.isLive || seminar.status === SeminarStatus.LIVE;

  return (
    <div className="page active" id="page-seminar-detail">
      <div className="page-hd">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              className={`badge ${isLive ? 'badge-red' : seminar.status === SeminarStatus.SCHEDULED ? 'badge-blue' : 'badge-slate'}`}
            >
              {isLive ? t('Live Now') : seminar.status === SeminarStatus.SCHEDULED ? t('Scheduled') : t('Draft Seminars')}
            </span>
            <span className="badge badge-slate" style={{ textTransform: 'uppercase' }}>
              {seminar.fileAccess}
            </span>
          </div>
          <div className="pg-title">{seminar.title}</div>
          <div className="pg-sub">
            {seminar.author?.fio || 'Ma`ruzachi'} · {seminar.department?.name || 'OKMK'} · 👁️ {seminar.viewCount || 0} ko'rish
          </div>
        </div>

        <div className="card-actions">
          {isLive ? (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 1.5s infinite' }}
              onClick={() => navigate(`/live/${seminar.id}`)}
            >
              <span>{isAuthor ? "🔴" : "🟢"}</span>
              <span>{isAuthor ? "Efirni boshqarish" : "Jonli efirga qo'shilish"}</span>
            </button>
          ) : (
            !isCompleted && isAuthor && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: '1px solid #b91c1c',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                }}
                disabled={startingLive}
                onClick={handleStartLive}
              >
                <span>🔴</span>
                <span>{startingLive ? "Boshlanmoqda..." : "Jonli efirni boshlash"}</span>
              </button>
            )
          )}

          {isCompleted && (
            <span
              className="badge badge-slate"
              style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <MonitorX size={16} color="#ffff" /> {seminar.isRecorded ? "Efir yakunlangan (Video yozuv mavjud)" : "Seminar yakunlangan"}
            </span>
          )}

          {isAuthor && !isCompleted && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pen size={16} color="#ffff" />
            </button>
          )}

          {isAuthenticated && (
            <>
              <button
                type="button"
                className={`btn ${isLiked ? 'btn-danger' : 'btn-ghost'} btn-sm`}
                onClick={handleToggleLike}
              >
                <ThumbsUp /> {likeCount}
              </button>
              <button
                type="button"
                className={`btn ${isSaved ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={handleToggleBookmark}
              >
                {isSaved ? <BookmarkCheck /> : <Bookmark />}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="main-grid">
        <div className="card" style={{ gridColumn: 'span 8', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Interaktiv ko'rish maydoni</div>
              <div className="card-subtitle">
                {activeViewerFile ? activeViewerFile.originalName : 'Fayl tanlanmagan'}
              </div>
            </div>
            {activeViewerFile && (
              <div className="card-actions">
                <a
                  href={filesApi.getDownloadUrl(activeViewerFile.id)}
                  download
                  className="btn btn-ghost btn-sm"
                >
                  Yuklab olish
                </a>
              </div>
            )}
          </div>

          <div className="card-body" style={{ flex: 1, position: 'relative', minHeight: 440, background: '#0b0f19' }}>
            {activeViewerFile ? (
              isVideoActive ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#050811',
                    padding: 10,
                  }}
                >
                  <video
                    controls
                    playsInline
                    src={filesApi.getViewUrl(activeViewerFile.id)}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 460,
                      borderRadius: 10,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  />
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                    📹 Jonli efirda yozib olingan video yozuvi ({activeViewerFile.originalName})
                  </div>
                </div>
              ) : is3DActive ? (
                <ThreeDViewer
                  modelUrl={filesApi.getViewUrl(activeViewerFile.id)}
                  modelName={activeViewerFile.originalName}
                  onBack={() => { }}
                />
              ) : (
                <InteractivePresentation
                  fileUrl={filesApi.getViewUrl(activeViewerFile.id)}
                  fileName={activeViewerFile.originalName}
                />
              )
            ) : (
              <div className="empty-state" style={{ color: '#8b949e', paddingTop: 100 }}>
                Ushbu seminarga biriktirilgan fayllar mavjud emas
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 4' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Seminar fayllari ({seminar.files?.length || 0})</div>
              <div className="card-subtitle">Ko'rish uchun faylni tanlang</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 14 }}>
            {seminar.files && seminar.files.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {seminar.files.map((file) => {
                  const isSelected = activeViewerFile?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      onClick={() => setActiveViewerFile(file)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--r-md)',
                        background: isSelected ? 'var(--blue-lt)' : 'var(--bg-raised)',
                        border: `1.5px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.originalName}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--f-mono)' }}>
                          {(file.size / (1024 * 1024)).toFixed(1)} MB · {file.fileType?.toUpperCase()}
                        </div>
                      </div>
                      <span className={`badge ${isSelected ? 'badge-blue' : 'badge-slate'}`} style={{ fontSize: 10 }}>
                        {isSelected ? 'Faol' : 'Ochish'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">Fayllar yuklanmagan</div>
            )}

            {seminar.description && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-pri)' }}>
                  Seminar tavsifi
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.4, margin: 0 }}>
                  {seminar.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Izohlar va Fikrlar ({comments.length})</div>
              <div className="card-subtitle">Ushbu seminar bo'yicha muhokama</div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            {isAuthenticated ? (
              <form onSubmit={handleAddComment} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Izohingizni yozing..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Send />
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ padding: '12px 14px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--text-sec)', marginBottom: 16 }}>
                Izoh qoldirish uchun tizimga kiring.
              </div>
            )}

            {comments.length === 0 ? (
              <div className="empty-state">Birinchi bo'lib izoh qoldiring</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments.map((comm) => (
                  <div
                    key={comm.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-pri)' }}>
                          {comm.user?.fio || comm.user?.username || 'Xodim'}
                        </span>
                        {comm.user?.lavozim && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({comm.user.lavozim})</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--f-mono)' }}>
                          {new Date(comm.createdAt).toLocaleString()}
                        </span>
                        {user && (user.id === comm.user?.id || user.role === 'admin' || user.role === 'superadmin') && (
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: 20, height: 20, color: 'var(--red)', fontSize: 11 }}
                            onClick={() => setDeleteCommentId(comm.id)}
                            title="O'chirish"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.4 }}>
                      {comm.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && seminar && (
        <EditSeminarModal
          seminar={seminar}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={(updated) => {
            setSeminar(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {deleteCommentId && (
        <ConfirmModal
          open={Boolean(deleteCommentId)}
          title="Izohni o'chirish"
          message="Haqiqatan ham ushbu izohni o'chirmoqchimisiz?"
          confirmText="O'chirish"
          cancelText="Bekor qilish"
          variant="danger"
          onConfirm={handleDeleteCommentConfirm}
          onCancel={() => setDeleteCommentId(null)}
        />
      )}
    </div>
  );
};

export default SeminarDetailPage;
