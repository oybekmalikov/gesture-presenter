import React, { useState, useRef } from 'react';
import { StoredFile } from '../types/file';
import { ApiService } from '../services/api';

interface FileLibraryProps {
  files: StoredFile[];
  loading: boolean;
  onRefresh: () => void;
  onOpenFile: (file: StoredFile) => void;
  onRequestDelete: (file: StoredFile) => void;
  serverOnline: boolean;
  gestureActive: boolean;
}

export const FileLibrary: React.FC<FileLibraryProps> = ({
  files,
  loading,
  onRefresh,
  onOpenFile,
  onRequestDelete,
  serverOnline,
  gestureActive,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'glb'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics calculation
  const pdfCount = files.filter((f) => f.fileType === 'pdf').length;
  const glbCount = files.filter((f) => f.fileType === 'glb').length;
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  // Filtered files
  const filteredFiles = files.filter((file) => {
    if (filterType !== 'all' && file.fileType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        file.originalName.toLowerCase().includes(q) ||
        file.fileName.toLowerCase().includes(q) ||
        (file.convertedFrom && file.convertedFrom.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleFileUpload = async (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));
    const size = selectedFile.size;

    // Validation
    const isDoc = ['.pdf', '.pptx'].includes(ext);
    const isModel = ['.step', '.stp', '.glb'].includes(ext);

    if (!isDoc && !isModel) {
      setUploadError(`Faqat .pdf, .pptx, .stp, .step, .glb fayllari qabul qilinadi. Tanlangan format: ${ext}`);
      return;
    }

    if (isDoc && size > 50 * 1024 * 1024) {
      setUploadError(`PDF va PPTX fayl hajmi 50 MB dan oshmasligi kerak. Siz yuklayotgan hajm: ${(size / 1024 / 1024).toFixed(1)} MB`);
      return;
    }

    if (isModel && size > 100 * 1024 * 1024) {
      setUploadError(`3D model fayl hajmi 100 MB dan oshmasligi kerak. Siz yuklayotgan hajm: ${(size / 1024 / 1024).toFixed(1)} MB`);
      return;
    }

    setUploadError(null);
    setUploading(true);

    if (ext === '.pptx') {
      setUploadStatus('PPTX fayl yuklanmoqda va PDF ga konvertatsiya qilinmoqda...');
    } else if (ext === '.step' || ext === '.stp') {
      setUploadStatus('STEP CAD modeli yuklanmoqda va 3D GLB ga o\'girilmoqda...');
    } else {
      setUploadStatus('Fayl serverga saqlanmoqda...');
    }

    try {
      const res = await ApiService.uploadFile(selectedFile);
      setUploadStatus(res.message || 'Muvaffaqiyatli yuklandi!');
      setTimeout(() => setUploadStatus(null), 3000);
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Yuklashda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      void handleFileUpload(droppedFile);
    }
  };

  return (
    <div
      style={{
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        padding: '24px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* 1. OKMK Industrial KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {/* KPI 1: PDF Presentations */}
        <div style={kpiCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={kpiLabelStyle}>TAQDIMOTLAR (PDF/PPTX)</span>
            <span style={{ fontSize: 20 }}>📄</span>
          </div>
          <div style={kpiValueStyle}>{pdfCount}</div>
          <div style={kpiSubStyle}>Ko'rish va qo'lda boshqarishga tayyor</div>
        </div>

        {/* KPI 2: 3D Engineering Models */}
        <div style={kpiCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={kpiLabelStyle}>3D MODELLAR (GLB/CAD)</span>
            <span style={{ fontSize: 20 }}>🧊</span>
          </div>
          <div style={{ ...kpiValueStyle, color: 'var(--cyan)' }}>{glbCount}</div>
          <div style={kpiSubStyle}>3D aylanma & qismlarga ajratish faol</div>
        </div>

        {/* KPI 3: Total Footprint */}
        <div style={kpiCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={kpiLabelStyle}>JAMI SAQLANGAN HAJM</span>
            <span style={{ fontSize: 20 }}>💾</span>
          </div>
          <div style={{ ...kpiValueStyle, color: 'var(--amber)' }}>{totalSizeMB} <span style={{ fontSize: 14 }}>MB</span></div>
          <div style={kpiSubStyle}>Jami {files.length} ta material</div>
        </div>

        {/* KPI 4: AI Gesture Status */}
        <div style={kpiCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={kpiLabelStyle}>AI GESTURE TIZIMI</span>
            <span style={{ fontSize: 20 }}>🖐️</span>
          </div>
          <div style={{ ...kpiValueStyle, color: gestureActive ? 'var(--amber)' : 'var(--text-muted)' }}>
            {gestureActive ? 'Faol' : 'Kutishda'}
          </div>
          <div style={kpiSubStyle}>
            {gestureActive ? 'MediaPipe kamera kuzatuvi yoqilgan' : 'Istalgan vaqtda yoqishingiz mumkin'}
          </div>
        </div>
      </div>

      {/* 2. Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--cyan)' : 'var(--border-bright)'}`,
          borderRadius: 'var(--radius)',
          background: isDragging
            ? 'rgba(0, 229, 255, 0.08)'
            : 'linear-gradient(135deg, rgba(16, 22, 38, 0.6) 0%, rgba(10, 13, 22, 0.7) 100%)',
          padding: '24px 20px',
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 200ms ease',
          boxShadow: isDragging ? 'var(--cyan-glow)' : 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.stp,.step,.glb,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFileUpload(f);
            e.target.value = '';
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--cyan-soft)',
              border: '1px solid var(--cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
            }}
          >
            {uploading ? '⏳' : '⚡'}
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              {uploading ? 'Fayl qayta ishlanmoqda...' : 'Yangi Taqdimot yoki 3D Model Yuklash'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Faylni bu yerga sudrab tashlang yoki bosib tanlang
            </p>
          </div>

          {/* Supported format badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
            <span style={formatBadgeStyle}>📄 .PDF (≤50MB)</span>
            <span style={{ ...formatBadgeStyle, borderColor: 'var(--amber)', color: 'var(--amber)' }}>
              📊 .PPTX ➔ .PDF (≤50MB)
            </span>
            <span style={{ ...formatBadgeStyle, borderColor: 'var(--cyan)', color: 'var(--cyan)' }}>
              🧊 .STEP / .STP ➔ .GLB (≤100MB)
            </span>
            <span style={{ ...formatBadgeStyle, borderColor: 'var(--blue)', color: 'var(--blue)' }}>
              📦 .GLB 3D (≤100MB)
            </span>
          </div>
        </div>

        {/* Status / Error Alerts */}
        {uploadStatus && (
          <div
            style={{
              marginTop: 14,
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--cyan-soft)',
              border: '1px solid var(--cyan)',
              color: 'var(--cyan)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              display: 'inline-block',
            }}
          >
            🔄 {uploadStatus}
          </div>
        )}

        {uploadError && (
          <div
            style={{
              marginTop: 14,
              padding: '8px 16px',
              borderRadius: 8,
              background: 'var(--danger-soft)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              display: 'inline-block',
            }}
          >
            ⚠️ {uploadError}
          </div>
        )}
      </div>

      {/* 3. Toolbar: Search, Filters & Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              ...filterBtnStyle,
              ...(filterType === 'all' ? activeFilterStyle : {}),
            }}
          >
            Barchasi ({files.length})
          </button>
          <button
            onClick={() => setFilterType('pdf')}
            style={{
              ...filterBtnStyle,
              ...(filterType === 'pdf' ? activeFilterStyle : {}),
            }}
          >
            📄 Taqdimotlar ({pdfCount})
          </button>
          <button
            onClick={() => setFilterType('glb')}
            style={{
              ...filterBtnStyle,
              ...(filterType === 'glb' ? activeFilterStyle : {}),
            }}
          >
            🧊 3D Modellar ({glbCount})
          </button>
        </div>

        {/* Search Bar & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="Materiallarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 10,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                fontSize: 14,
              }}
            >
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  fontSize: 14,
                  padding: '2px 6px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onRefresh}
            title="Yangilash"
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            <span>🔄</span> Yangilash
          </button>
        </div>
      </div>

      {/* 4. Material Cards Grid */}
      {loading ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: 'var(--cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
          }}
        >
          Yuklanmoqda...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius)',
            border: '1px dashed var(--border)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <h4 style={{ fontSize: 16, color: '#fff', marginBottom: 6 }}>Materiallar topilmadi</h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {searchQuery ? 'Qidiruv bo\'yicha mos fayl yo\'q' : 'Yuqoridagi maydondan fayl yuklashingiz mumkin'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="okmk-card-interactive"
              style={{
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(12px)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                position: 'relative',
              }}
            >
              {/* Card Header: Icon + Title + Badges */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: file.fileType === 'pdf' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                      border: `1px solid ${file.fileType === 'pdf' ? 'var(--blue)' : 'var(--cyan)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {file.fileType === 'pdf' ? '📄' : '🧊'}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4
                      title={file.originalName}
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#fff',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.originalName}
                    </h4>

                    {/* Tag badge */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: file.fileType === 'pdf' ? 'var(--blue-soft)' : 'var(--cyan-soft)',
                          color: file.fileType === 'pdf' ? 'var(--blue)' : 'var(--cyan)',
                          border: `1px solid ${file.fileType === 'pdf' ? 'rgba(59,130,246,0.3)' : 'rgba(0,229,255,0.3)'}`,
                        }}
                      >
                        {file.fileType === 'pdf' ? 'PDF TAQDIMOT' : '3D GLB MODEL'}
                      </span>

                      {file.convertedFrom && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'var(--amber-soft)',
                            color: 'var(--amber)',
                            border: '1px solid rgba(245,158,11,0.3)',
                          }}
                        >
                          {file.convertedFrom.toUpperCase()} DAN O'GIRILGAN
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata details */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    paddingTop: 8,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <span>Hajm: {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>{new Date(file.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* 1. Open / Present Button */}
                <button
                  onClick={() => onOpenFile(file)}
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: file.fileType === 'pdf'
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                      : 'linear-gradient(135deg, rgba(0, 229, 255, 0.25) 0%, rgba(59, 130, 246, 0.3) 100%)',
                    border: file.fileType === 'pdf' ? 'none' : '1px solid var(--cyan)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: file.fileType === 'pdf' ? 'var(--blue-glow)' : 'var(--cyan-glow)',
                  }}
                >
                  <span>▶</span> {file.fileType === 'pdf' ? 'Taqdimot qilish' : '3D Ko\'rish'}
                </button>

                {/* 2. Download to local computer */}
                <a
                  href={ApiService.getDownloadUrl(file.id)}
                  download={file.originalName}
                  title="Kompyuterga yuklab olish"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  📥
                </a>

                {/* 3. Delete button with root password protection */}
                <button
                  onClick={() => onRequestDelete(file)}
                  title="O'chirish (Root parol talab etiladi)"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--danger)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const kpiCardStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(16, 22, 38, 0.85) 0%, rgba(10, 13, 22, 0.85) 100%)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 8,
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  fontFamily: 'var(--font-mono)',
  letterSpacing: 1,
  color: 'var(--text-muted)',
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  fontFamily: 'var(--font-display)',
  color: '#fff',
};

const kpiSubStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-dim)',
};

const formatBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  padding: '3px 8px',
  borderRadius: 6,
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
};

const filterBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'var(--font-display)',
};

const activeFilterStyle: React.CSSProperties = {
  background: 'var(--cyan-soft)',
  border: '1px solid var(--cyan)',
  color: 'var(--cyan)',
};
