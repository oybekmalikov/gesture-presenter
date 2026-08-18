import React, { useState, useRef } from 'react';
import { StoredFile } from '../types/file';
import { ApiService } from '../services/api';

interface DashboardProps {
  files: StoredFile[];
  loading: boolean;
  onRefresh: () => void;
  onOpenFile: (file: StoredFile) => void;
  onRequestDelete: (file: StoredFile) => void;
  gestureActive: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  files,
  loading,
  onRefresh,
  onOpenFile,
  onRequestDelete,
  gestureActive,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pdf' | 'glb'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pdfCount = files.filter((f) => f.fileType === 'pdf').length;
  const glbCount = files.filter((f) => f.fileType === 'glb').length;
  const recentFiles = files.slice(0, 8);

  const handleFileUpload = async (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    const ext = name.slice(name.lastIndexOf('.'));
    const size = selectedFile.size;

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
      setUploadStatus('PPTX ➔ PDF ga konvertatsiya qilinmoqda...');
    } else if (ext === '.step' || ext === '.stp') {
      setUploadStatus('STEP CAD ➔ GLB ga o\'girilmoqda...');
    } else {
      setUploadStatus('Fayl saqlanmoqda...');
    }

    try {
      const res = await ApiService.uploadFile(selectedFile);
      setUploadStatus(res.message || 'Muvaffaqiyatli yuklandi!');
      setTimeout(() => setUploadStatus(null), 3500);
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

  const filteredFiles = files.filter((f) => {
    if (filter === 'all') return true;
    return f.fileType === filter;
  });

  return (
    <div
      style={{
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        padding: '20px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        background: '#090d16',
      }}
    >
      {/* ── 1. Top KPI Row (6 cards matching ui-overview1.png) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {/* KPI 1: FAOL TAQDIMOTLAR (Blue accent) */}
        <div style={{ ...kpiCardBaseStyle, borderLeft: '3px solid #3b82f6' }}>
          <div style={kpiHeaderStyle}>
            <span style={kpiTitleStyle}>FAOL TAQDIMOTLAR</span>
          </div>
          <div style={{ ...kpiNumberStyle, color: '#fff' }}>{pdfCount}</div>
          <div style={kpiDescStyle}>Jami {files.length} ta · {pdfCount} ta PDF tayyor</div>
        </div>

        {/* KPI 2: YANGI MATERIAL (Red/Amber accent) */}
        <div style={{ ...kpiCardBaseStyle, borderLeft: '3px solid #ef4444' }}>
          <div style={kpiHeaderStyle}>
            <span style={kpiTitleStyle}>YANGI YUKLANGANLAR</span>
          </div>
          <div style={{ ...kpiNumberStyle, color: '#fff' }}>{files.length}</div>
          <div style={kpiDescStyle}>Real vaqt rejimida saqlangan</div>
        </div>

        {/* KPI 3: 3D CAD MODELLAR (Orange accent) */}
        <div style={{ ...kpiCardBaseStyle, borderLeft: '3px solid #f59e0b' }}>
          <div style={kpiHeaderStyle}>
            <span style={kpiTitleStyle}>3D CAD MODELLAR</span>
          </div>
          <div style={{ ...kpiNumberStyle, color: 'var(--amber)' }}>{glbCount}</div>
          <div style={kpiDescStyle}>GLB & STEP sinxronlangan</div>
        </div>

        {/* KPI 4: AI GESTURE TIZIMI (Green accent) */}
        <div style={{ ...kpiCardBaseStyle, borderLeft: '3px solid #10b981' }}>
          <div style={kpiHeaderStyle}>
            <span style={kpiTitleStyle}>AI GESTURE TIZIMI</span>
          </div>
          <div style={{ ...kpiNumberStyle, color: gestureActive ? 'var(--success)' : '#94a3b8' }}>
            {gestureActive ? 'FAOL' : 'TAYYOR'}
          </div>
          <div style={kpiDescStyle}>MediaPipe 2.0 Vision nazorati</div>
        </div>

        {/* KPI 5: ROOT XAVFSIZLIK (Cyan accent) */}
        <div style={{ ...kpiCardBaseStyle, borderLeft: '3px solid #00e5ff' }}>
          <div style={kpiHeaderStyle}>
            <span style={kpiTitleStyle}>ROOT HIMOYASI</span>
          </div>
          <div style={{ ...kpiNumberStyle, color: 'var(--cyan)' }}>0</div>
          <div style={kpiDescStyle}>Ruxsatsiz o'chirish holatlari: 0</div>
        </div>

        {/* KPI 6: TIZIM MUVOFIQLIGI (Emerald accent) */}
        <div style={{ ...kpiCardBaseStyle, borderLeft: '3px solid #35d488' }}>
          <div style={kpiHeaderStyle}>
            <span style={kpiTitleStyle}>TIZIM MUVOFIQLIGI</span>
          </div>
          <div style={{ ...kpiNumberStyle, color: '#35d488' }}>98%</div>
          <div style={kpiDescStyle}>Barcha talablarga to'liq mos</div>
        </div>
      </div>

      {/* ── 2. Main Split Area (Left Large Content + Right Quick List) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Left Section: Material Cards & Upload Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header with filters */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 10,
              background: '#0e1322',
              border: '1px solid #1c2333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                Oxirgi taqdimotlar va 3D modellar
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-dim)',
                  background: '#161e33',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {filteredFiles.length} ta material
              </span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  ...filterPillStyle,
                  ...(filter === 'all' ? activeFilterPillStyle : {}),
                }}
              >
                Barchasi
              </button>
              <button
                onClick={() => setFilter('pdf')}
                style={{
                  ...filterPillStyle,
                  ...(filter === 'pdf' ? activeFilterPillStyle : {}),
                }}
              >
                📄 PDF / PPTX
              </button>
              <button
                onClick={() => setFilter('glb')}
                style={{
                  ...filterPillStyle,
                  ...(filter === 'glb' ? activeFilterPillStyle : {}),
                }}
              >
                🧊 3D CAD
              </button>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--cyan)' : '#1e293b'}`,
              borderRadius: 10,
              background: isDragging ? 'rgba(0, 229, 255, 0.05)' : '#0e1322',
              padding: '20px 24px',
              cursor: uploading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 180ms ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.stp,.step,.glb"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileUpload(f);
                e.target.value = '';
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--cyan-soft)',
                  border: '1px solid var(--cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                {uploading ? '⏳' : '⚡'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {uploading ? 'Fayl qayta ishlanmoqda...' : 'Yangi material yuklash (PDF, PPTX, STEP, GLB)'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  PDF/PPTX ≤ 50MB · STEP/GLB ≤ 100MB · Avtomatik konvertatsiya
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <span style={uploadBadgeStyle}>.PDF</span>
              <span style={{ ...uploadBadgeStyle, borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                .PPTX ➔ .PDF
              </span>
              <span style={{ ...uploadBadgeStyle, borderColor: 'var(--cyan)', color: 'var(--cyan)' }}>
                .STEP ➔ .GLB
              </span>
            </div>
          </div>

          {/* Upload Status & Error Banner */}
          {uploadStatus && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'var(--cyan-soft)',
                border: '1px solid var(--cyan)',
                color: 'var(--cyan)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
            >
              🔄 {uploadStatus}
            </div>
          )}

          {uploadError && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}
            >
              ⚠️ {uploadError}
            </div>
          )}

          {/* Grid of Material Cards */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              Yuklanmoqda...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#0e1322',
                borderRadius: 10,
                border: '1px dashed #1c2333',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Materiallar mavjud emas</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Yuqoridagi maydon orqali taqdimot yoki 3D model yuklang
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 14,
              }}
            >
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    borderRadius: 10,
                    background: '#0e1322',
                    border: '1px solid #1c2333',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'border-color 180ms ease, background 180ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.4)';
                    e.currentTarget.style.background = '#12182b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1c2333';
                    e.currentTarget.style.background = '#0e1322';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: file.fileType === 'pdf' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                          border: `1px solid ${file.fileType === 'pdf' ? 'var(--blue)' : 'var(--cyan)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {file.fileType === 'pdf' ? '📄' : '🧊'}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          title={file.originalName}
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.originalName}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {(file.size / (1024 * 1024)).toFixed(2)} MB · {new Date(file.createdAt).toLocaleDateString('uz-UZ')}
                        </div>
                      </div>
                    </div>

                    {file.convertedFrom && (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'var(--font-mono)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--amber-soft)',
                          color: 'var(--amber)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'inline-block',
                          marginBottom: 4,
                        }}
                      >
                        {file.convertedFrom.toUpperCase()} DAN O'GIRILGAN
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => onOpenFile(file)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: file.fileType === 'pdf'
                          ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                          : 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(59, 130, 246, 0.25) 100%)',
                        border: file.fileType === 'pdf' ? 'none' : '1px solid var(--cyan)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <span>▶</span> {file.fileType === 'pdf' ? 'Taqdimot' : '3D Ko\'rish'}
                    </button>

                    <a
                      href={ApiService.getDownloadUrl(file.id)}
                      download={file.originalName}
                      title="Yuklab olish"
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: '#161e33',
                        border: '1px solid #1c2333',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      📥
                    </a>

                    <button
                      onClick={() => onRequestDelete(file)}
                      title="O'chirish (Root parol talab etiladi)"
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: '#161e33',
                        border: '1px solid #1c2333',
                        color: 'var(--danger)',
                        fontSize: 12,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Bottom Analytics row matching ui-overview1.png ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              gap: 14,
              marginTop: 4,
            }}
          >
            {/* Box 1: Qoidabuzarlik dinamikasi / Taqdimot faolligi */}
            <div style={analyticsBoxStyle}>
              <div style={analyticsHeaderStyle}>
                <span>Taqdimotlar dinamikasi</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Bugun</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, marginTop: 10 }}>
                {[35, 60, 45, 80, 50, 95, 70, 85, 65, 90, 75, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: i % 2 === 0 ? 'var(--blue)' : 'var(--cyan)',
                      borderRadius: '2px 2px 0 0',
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Box 2: SHHV talablariga rioya / AI Gesture Aniqligi */}
            <div style={analyticsBoxStyle}>
              <div style={analyticsHeaderStyle}>
                <span>AI Gesture aniqlik darajasi</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Bugun</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, marginTop: 10 }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    border: '3px solid var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>94%</span>
                  <span style={{ fontSize: 7, color: 'var(--text-muted)' }}>MUVOFIQ</span>
                </div>
              </div>
            </div>

            {/* Box 3: Hududlar bo'yicha xavf xaritasi / Server holati */}
            <div style={analyticsBoxStyle}>
              <div style={analyticsHeaderStyle}>
                <span>Tizim holati matritsasi</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Bugun</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 10 }}>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      height: 26,
                      borderRadius: 4,
                      background: idx === 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${idx === 1 ? 'var(--amber)' : 'var(--success)'}`,
                      fontSize: 8,
                      fontFamily: 'var(--font-mono)',
                      color: idx === 1 ? 'var(--amber)' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    CAM-{idx + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: "Ko'rib chiqishdagi" List matching ui-overview1.png */}
        <aside
          style={{
            background: '#0e1322',
            border: '1px solid #1c2333',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: 'calc(100vh - 180px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
              Ko'rib chiqishdagi
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: '#fff',
                background: '#ef4444',
                padding: '2px 8px',
                borderRadius: 10,
                fontWeight: 700,
              }}
            >
              {recentFiles.length} Yangi
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentFiles.map((file, i) => (
              <div
                key={file.id}
                onClick={() => onOpenFile(file)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: '#131929',
                  border: '1px solid #1c2333',
                  cursor: 'pointer',
                  transition: 'border-color 160ms ease, background 160ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.4)';
                  e.currentTarget.style.background = '#172036';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1c2333';
                  e.currentTarget.style.background = '#131929';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 180,
                    }}
                  >
                    {file.originalName}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {11 + (i % 5)}:0{i * 2}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ color: file.fileType === 'pdf' ? 'var(--blue)' : 'var(--cyan)' }}>
                    {file.fileType === 'pdf' ? '📄 PDF Taqdimot' : '🧊 3D GLB Model'}
                  </span>
                  <span style={{ color: 'var(--success)' }}>AI Tayyor: 98%</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

const kpiCardBaseStyle: React.CSSProperties = {
  background: '#0e1322',
  border: '1px solid #1c2333',
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 4,
};

const kpiHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const kpiTitleStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontFamily: 'var(--font-mono)',
  letterSpacing: 1,
  color: 'var(--text-muted)',
  fontWeight: 600,
};

const kpiNumberStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  fontFamily: 'var(--font-display)',
  lineHeight: 1.1,
};

const kpiDescStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-dim)',
  fontFamily: 'var(--font-mono)',
};

const filterPillStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 6,
  background: '#161e33',
  border: '1px solid #1c2333',
  color: 'var(--text-muted)',
  fontSize: 11,
  fontFamily: 'var(--font-display)',
};

const activeFilterPillStyle: React.CSSProperties = {
  background: 'var(--cyan-soft)',
  borderColor: 'var(--cyan)',
  color: 'var(--cyan)',
};

const uploadBadgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  padding: '2px 8px',
  borderRadius: 4,
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid #1c2333',
  color: 'var(--text-muted)',
};

const analyticsBoxStyle: React.CSSProperties = {
  background: '#0e1322',
  border: '1px solid #1c2333',
  borderRadius: 8,
  padding: '12px 14px',
};

const analyticsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 11,
  fontWeight: 600,
  color: '#fff',
  fontFamily: 'var(--font-display)',
};
