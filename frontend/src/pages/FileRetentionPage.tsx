// src/pages/FileRetentionPage.tsx
import React, { useEffect, useState } from 'react';
import { filesApi } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useI18n } from '../utils/i18n';
import { Clock, SquareOff, Trash, X } from 'lucide-react';

export const FileRetentionPage: React.FC = () => {
  const toast = useToast();
  const t = useI18n();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [retentionDays, setRetentionDays] = useState(14);
  const [reason, setReason] = useState(
    "Eski va kam foydalanilgan fayllar xotirani tejash maqsadida o'chirilishga qo'yildi",
  );
  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [candRes, pendRes] = await Promise.all([
        filesApi.getCleanupCandidates(),
        filesApi.getPendingCleanup(),
      ]);
      if (Array.isArray(candRes)) setCandidates(candRes);
      if (Array.isArray(pendRes)) setPendingFiles(pendRes);
    } catch { }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleMarkCleanup = async () => {
    if (selectedIds.length === 0) return;
    try {
      await filesApi.markCleanup(selectedIds, retentionDays, reason);
      toast.success(
        `${selectedIds.length} ta fayl ${retentionDays} kundan so'ng o'chirilishga belgilandi`,
      );
      setSelectedIds([]);
      loadData();
    } catch {
      toast.error("Fayllarni tozalashga belgilashda xatolik");
    }
  };

  const handleCancelCleanup = async (fileIds: string[]) => {
    try {
      await filesApi.cancelCleanup(fileIds);
      toast.success("Fayllarni o'chirish bekor qilindi");
      loadData();
    } catch {
      toast.error("Bekor qilishda xatolik");
    }
  };

  const handleForceDeleteConfirm = async () => {
    if (!forceDeleteId) return;
    try {
      await filesApi.forceDelete(forceDeleteId);
      toast.success("Fayl butunlay o'chirildi");
      loadData();
    } catch {
      toast.error("Faylni o'chirishda xatolik");
    } finally {
      setForceDeleteId(null);
    }
  };

  return (
    <div className="page admin-page active">
      <div className="page-hd">
        <div>
          <div className="pg-title">{t('File Retention')}</div>
          <div className="pg-sub">
            Server xotirasi boshqaruvi va eskirgan fayllarni avtomatik tozalash
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(forceDeleteId)}
        onCancel={() => setForceDeleteId(null)}
        onConfirm={handleForceDeleteConfirm}
        title="Faylni o'chirish"
        message="Haqiqatan ham ushbu faylni butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        confirmText="O'chirish"
        cancelText="Bekor qilish"
        variant="danger"
      />

      <div className="stats-strip">
        <StatCard
          title="O'chirishga qo'yilgan"
          value={pendingFiles.length}
          meta="Muddati yetganda o'chiriladi"
          colorClass="sc-red"
        />
        <StatCard
          title="Tozalash nomzodlari"
          value={candidates.length}
          meta="6 oydan eski yoki kam ko'rilgan"
          colorClass="sc-amber"
        />
        <StatCard
          title="Fayl hajmi limitlari"
          value="50MB / 100MB"
          meta="PDF/PPTX: 50MB · 3D STEP: 100MB"
          colorClass="sc-blue"
        />
        <StatCard
          title="Xotira holati"
          value="Optimal"
          meta="OKMK MinIO S3 Ombori"
          colorClass="sc-green"
        />
      </div>

      <div className="admin-page-body">
        <div className="card admin-table-card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">O'chirishga belgilangan fayllar ({pendingFiles.length})</div>
              <div className="card-subtitle">Foydalanuvchilarga xabarnoma yuborilgan</div>
            </div>
          </div>
          <div className="card-body">
            {pendingFiles.length === 0 ? (
              <div className="empty-state">Hozirda o'chirishga qo'yilgan fayllar yo'q</div>
            ) : (
              <div className="table-wrap">
                <table className="tbl admin-table">
                  <thead>
                    <tr>
                      <th>Fayl nomi</th>
                      <th>Seminar</th>
                      <th>Hajmi</th>
                      <th>Qolgan kunlar</th>
                      <th>Sabab</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingFiles.map((f) => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600 }}>{f.originalName}</td>
                        <td>{f.seminar?.title || '—'}</td>
                        <td style={{ fontFamily: 'var(--f-mono)' }}>
                          {(f.size / (1024 * 1024)).toFixed(1)} MB
                        </td>
                        <td>
                          <span className="badge badge-red">{f.remainingDays} kun qoldi</span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-sec)' }}>{f.deletionReason || '—'}</td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleCancelCleanup([f.id])}
                          >
                            <X /> Bekor qilish
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setForceDeleteId(f.id)}
                          >
                            <Trash /> O'chirish
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

        <div className="card admin-table-card">
          <div className="card-header">
            <div>
              <div className="card-title">Eskirgan fayllar ({candidates.length})</div>
              <div className="card-subtitle">Ko'rishlar soni kam bo'lgan fayllar</div>
            </div>
            {selectedIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  className="f-select"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                >
                  <option value={7}>7 kun muhlat</option>
                  <option value={14}>14 kun muhlat</option>
                  <option value={30}>30 kun muhlat</option>
                </select>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleMarkCleanup}
                >
                  <Clock /> Tanlanganlarni o'chirishga qo'yish ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
          <div className="card-body">
            {candidates.length === 0 ? (
              <div className="empty-state"><SquareOff /> Tozalashga nomzod eski fayllar topilmadi</div>
            ) : (
              <div className="table-wrap">
                <table className="tbl admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === candidates.length && candidates.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(candidates.map((c) => c.id));
                            else setSelectedIds([]);
                          }}
                        />
                      </th>
                      <th>Fayl nomi</th>
                      <th>Seminar</th>
                      <th>Turi</th>
                      <th>Hajmi</th>
                      <th>Yaratilgan</th>
                      <th>Amal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => handleSelectToggle(c.id)}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.originalName}</td>
                        <td>{c.seminar?.title || '—'}</td>
                        <td>
                          <span className="badge badge-slate">{c.fileType?.toUpperCase()}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--f-mono)' }}>
                          {(c.size / (1024 * 1024)).toFixed(1)} MB
                        </td>
                        <td style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setForceDeleteId(c.id)}
                          >
                            <Trash /> Darhol o'chirish
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

export default FileRetentionPage;
