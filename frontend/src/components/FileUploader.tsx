import { useCallback, useRef, useState } from 'react';

export interface UploadResult {
  fileUrl: string;
  originalName: string;
}

interface FileUploaderProps {
  onUploaded: (result: UploadResult) => void;
}

export function FileUploader({ onUploaded }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    (file: File) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (ext !== '.pdf' && file.type !== 'application/pdf') {
        setError(`Qo'llab-quvvatlanmaydigan format: ${ext}. Faqat PDF fayl tanlang.`);
        return;
      }

      setError(null);
      onUploaded({
        fileUrl: URL.createObjectURL(file),
        originalName: file.name,
      });
    },
    [onUploaded],
  );

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        gap: 28,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: 2,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Gesture Presenter
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            lineHeight: 1.15,
            margin: '0 0 12px',
          }}
        >
          Taqdimotni qo'lingiz bilan boshqaring
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          PDF faylini tanlang — u serverga yuborilmaydi va to'g'ridan-to'g'ri brauzerda ochiladi. Kamera oldida turib slaydlarni
          almashtiring, kattalashtiring va kerakli joyni lazer kursor bilan ko'rsating.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void uploadFile(file);
        }}
        style={{
          width: '100%',
          maxWidth: 480,
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          background: dragging ? 'var(--accent-soft)' : 'var(--surface)',
          borderRadius: 'var(--radius)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 120ms ease, background 120ms ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
        <div style={{ fontSize: 34, marginBottom: 10 }}>📄</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>PDF faylni shu yerga tashlang</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          yoki bosib tanlang · .pdf
        </div>
      </label>

      {error && (
        <div
          role="alert"
          style={{
            color: 'var(--danger)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            maxWidth: 480,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
