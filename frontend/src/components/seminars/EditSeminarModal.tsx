import React, { useState, useEffect, useRef } from 'react';
import { seminarsApi, filesApi, usersApi, departmentsApi } from '../../services/api';
import { Seminar, FileAccess } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../utils/i18n';

interface EditSeminarModalProps {
  seminar: Seminar;
  onClose: () => void;
  onUpdated: (seminar: Seminar) => void;
}

export const EditSeminarModal: React.FC<EditSeminarModalProps> = ({
  seminar,
  onClose,
  onUpdated,
}) => {
  const toast = useToast();
  const t = useI18n();

  const [title, setTitle] = useState(seminar.title || '');
  const [description, setDescription] = useState(seminar.description || '');
  const [scheduledAt, setScheduledAt] = useState(
    seminar.scheduledAt
      ? new Date(seminar.scheduledAt).toISOString().slice(0, 16)
      : '',
  );
  const [accessScope, setAccessScope] = useState<'public' | 'restricted'>(
    seminar.fileAccess === FileAccess.PUBLIC ? 'public' : 'restricted',
  );
  const [fileAccess, setFileAccess] = useState<FileAccess>(
    seminar.fileAccess || FileAccess.PUBLIC,
  );
  const [tagsInput, setTagsInput] = useState(
    seminar.tags?.map((t) => `#${t.name}`).join(' ') || '',
  );
  const [targetUserId, setTargetUserId] = useState(seminar.targetUserId || '');
  const [departmentId, setDepartmentId] = useState(seminar.departmentId || '');

  // Cover Image
  const [coverImageUrl, setCoverImageUrl] = useState(seminar.coverImageUrl || '');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    seminar.coverImageUrl || null,
  );
  const coverInputRef = useRef<HTMLInputElement>(null);

  // New attached files
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [usersList, setUsersList] = useState<{ id: string; fio: string; lavozim?: string }[]>([]);
  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    departmentsApi
      .findAll()
      .then((res) => {
        if (Array.isArray(res)) setDepartmentsList(res);
      })
      .catch(() => {});

    usersApi
      .findAll({ limit: 100 })
      .then((res) => {
        if (res?.items) setUsersList(res.items);
      })
      .catch(() => {});
  }, []);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Seminar nomini kiritish majburiy');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let finalCoverUrl = coverImageUrl;
      if (coverImageFile) {
        const coverRes = await filesApi.uploadCover(coverImageFile);
        finalCoverUrl = coverRes.url;
      }

      const rawTags = tagsInput
        .split(/[,;\s]+/)
        .map((item) => item.trim().replace(/^#+/, ''))
        .filter((item) => item.length > 1);

      const effectiveFileAccess =
        accessScope === 'public'
          ? FileAccess.PUBLIC
          : fileAccess === FileAccess.PUBLIC
            ? FileAccess.READABLE
            : fileAccess;

      const updated = await seminarsApi.update(seminar.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        coverImageUrl: finalCoverUrl || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        fileAccess: effectiveFileAccess,
        tags: rawTags,
        targetUserId: accessScope === 'restricted' ? targetUserId || undefined : undefined,
        departmentId: departmentId || undefined,
      });

      // Upload newly added files if any
      if (newFiles.length > 0) {
        await filesApi.uploadMultiple(seminar.id, newFiles);
      }

      onUpdated(updated);
      toast.success('Seminar muvaffaqiyatli yangilandi');
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message?.uz ||
        err.response?.data?.message ||
        'Seminarni tahrirlashda xatolik yuz berdi';
      const errorText = typeof msg === 'string' ? msg : JSON.stringify(msg);
      setError(errorText);
      toast.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="camera-directory-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <div>
            <div className="card-title" style={{ fontSize: 16 }}>Seminarni tahrirlash</div>
            <div className="card-subtitle">Sarlavha, tavsif, muqova va ochiqlik parametrlarini yangilash</div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 18px',
              color: 'var(--red)',
              fontSize: 12,
              background: 'var(--red-lt)',
              borderBottom: '1px solid var(--red-bdr)',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Seminar nomi *</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Cover Image */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Seminar muqova rasmi (Cover image)</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 12,
                  background: 'var(--bg-raised)',
                  border: '1.5px dashed var(--border)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                {coverImagePreview ? (
                  <div
                    style={{
                      width: 120,
                      height: 70,
                      borderRadius: 8,
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={coverImagePreview}
                      alt="Muqova"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImageFile(null);
                        setCoverImagePreview(null);
                        setCoverImageUrl('');
                      }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    style={{
                      width: 120,
                      height: 70,
                      borderRadius: 8,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      flexShrink: 0,
                      color: 'var(--text-muted)',
                      fontSize: 10,
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🖼️</span>
                    <span>Rasm tanlash</span>
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    📷 Yangi muqova rasmi yuklash
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Tavsif</label>
              <textarea
                className="form-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Access Scope */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Seminar ochiqlik doirasi *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                <div
                  onClick={() => {
                    setAccessScope('public');
                    setFileAccess(FileAccess.PUBLIC);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    background: accessScope === 'public' ? 'var(--blue-lt)' : 'var(--bg-raised)',
                    border: `1.5px solid ${accessScope === 'public' ? 'var(--blue)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-pri)' }}>
                    🌐 Barcha uchun ochiq
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Barcha xodimlar ko'ra oladi
                  </div>
                </div>

                <div
                  onClick={() => {
                    setAccessScope('restricted');
                    setFileAccess(FileAccess.READABLE);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    background: accessScope === 'restricted' ? 'var(--blue-lt)' : 'var(--bg-raised)',
                    border: `1.5px solid ${accessScope === 'restricted' ? 'var(--blue)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-pri)' }}>
                    🔒 Faqat tanlangan odamlar uchun
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    Faqat belgilangan shaxs yoki bo'lim ko'radi
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Department */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">O'tkazilish sanasi va vaqti</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biriktirilgan Bo'lim</label>
                <select
                  className="form-input"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Bo'limni tanlang...</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {accessScope === 'restricted' && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Mo'ljallangan xodim (Target User)</label>
                <select
                  className="form-input"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                >
                  <option value="">Xodimni tanlang...</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fio} {u.lavozim ? `(${u.lavozim})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tags */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Teglar</label>
              <input
                type="text"
                className="form-input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            {/* Additional Files Upload */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Yangi fayl qo'shish (.pdf, .pptx, .step, .glb)</label>
              <input
                type="file"
                multiple
                accept=".pdf,.pptx,.ppt,.step,.stp,.glb,.gltf,.mp4,.webm"
                onChange={handleNewFileChange}
                className="form-input"
              />
              {newFiles.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {newFiles.length} ta yangi fayl biriktiriladi
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                paddingTop: 14,
                borderTop: '1px solid var(--border)',
              }}
            >
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('Loading') : "O'zgarishlarni saqlash"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSeminarModal;
