// src/components/seminars/CreateSeminarModal.tsx
import React, { useState, useEffect } from 'react';
import { seminarsApi, filesApi, usersApi, departmentsApi } from '../../services/api';
import { Seminar, FileAccess } from '../../types';
import { useI18n } from '../../utils/i18n';

interface CreateSeminarModalProps {
  onClose: () => void;
  onCreated: (seminar: Seminar) => void;
}

export const CreateSeminarModal: React.FC<CreateSeminarModalProps> = ({
  onClose,
  onCreated,
}) => {
  const t = useI18n();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [fileAccess, setFileAccess] = useState<FileAccess>(FileAccess.PUBLIC);
  const [tagsInput, setTagsInput] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const [files, setFiles] = useState<File[]>([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
      const rawTags = tagsInput
        .split(/[,;\s]+/)
        .map((item) => item.trim().replace(/^#+/, ''))
        .filter((item) => item.length > 1);

      const createdSeminar = await seminarsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        fileAccess,
        tags: rawTags,
        targetUserId: targetUserId || undefined,
        departmentId: departmentId || undefined,
      });

      // Upload attached files if any
      if (files.length > 0 && createdSeminar?.id) {
        await filesApi.uploadMultiple(createdSeminar.id, files);
      }

      onCreated(createdSeminar);
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message?.uz ||
        err.response?.data?.message ||
        'Seminar yaratishda xatolik yuz berdi';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <div>
            <div className="card-title">{t('Create Seminar')}</div>
            <div className="card-subtitle">Yangi taqdimot yoki 3D model biriktirish</div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 16px', color: 'var(--red)', fontSize: 12, background: 'var(--red-lt)' }}>
            {error}
          </div>
        )}

        <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Seminar nomi *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masalan: Ishlab chiqarish samaradorligi va xavfsizlik 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Tavsif</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Seminar maqsadi va qisqacha ma'lumot..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
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
                <label className="form-label">Fayllar ochiqligi (File Access)</label>
                <select
                  className="form-input"
                  value={fileAccess}
                  onChange={(e) => setFileAccess(e.target.value as FileAccess)}
                >
                  <option value={FileAccess.PUBLIC}>Ochiq (Barcha ko'ra oladi va yuklaydi)</option>
                  <option value={FileAccess.READABLE}>Faqat ko'rish (Yuklab olish yopiq)</option>
                  <option value={FileAccess.PRIVATE}>Yopiq (Faqat bo'lim va adminlar)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Bo'lim</label>
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

              <div className="form-group">
                <label className="form-label">Mo'ljallangan shaxs (Target User)</label>
                <select
                  className="form-input"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                >
                  <option value="">Ixtiyoriy (Hammasi uchun)</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fio} {u.lavozim ? `(${u.lavozim})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Teglar (vergul yoki bo'sh joy bilan)</label>
              <input
                type="text"
                className="form-input"
                placeholder="masalan: #mbf #xavfsizlik #3d"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            {/* File Upload Section */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Fayllar biriktirish (.pdf, .pptx, .step, .glb, video)</label>
              <div
                style={{
                  border: '1.5px dashed var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: 16,
                  textAlign: 'center',
                  background: 'var(--bg-raised)',
                }}
              >
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                  Fayllarni tanlash
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.pptx,.ppt,.step,.stp,.glb,.gltf,.mp4,.webm"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  PDF/PPTX: maks 50MB · 3D STEP: maks 100MB
                </div>
              </div>

              {files.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{f.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--f-mono)', color: 'var(--text-muted)' }}>
                          {(f.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ width: 20, height: 20, color: 'var(--red)', fontSize: 12 }}
                          onClick={() => removeSelectedFile(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                {t('Cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('Loading') : t('Save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSeminarModal;
