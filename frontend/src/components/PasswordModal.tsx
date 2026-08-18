import React, { useState, useEffect, useRef } from 'react';
import { StoredFile } from '../types/file';

interface PasswordModalProps {
  file: StoredFile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  file,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Iltimos, root parolini kiriting.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Parol noto\'g\'ri kiritildi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 6, 10, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'linear-gradient(180deg, #131929 0%, #0c101c 100%)',
          border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), var(--cyan-glow)',
          overflow: 'hidden',
          animation: 'modalFadeIn 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                fontSize: 16,
              }}
            >
              🔒
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                Faylni O'chirishni Tasdiqlang
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Xavfsizlik uchun Root parol talab etiladi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              color: 'var(--text-muted)',
              fontSize: 20,
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: 22 }}>
          {/* File details card */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-surface-2)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 24 }}>
              {file.fileType === 'pdf' ? '📄' : '🧊'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {file.originalName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: 2,
                }}
              >
                Hajmi: {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.fileType.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: 6,
                fontFamily: 'var(--font-mono)',
              }}
            >
              ROOT_PASSWORD:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Root parolini kiriting..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 14px',
                  borderRadius: 8,
                  background: 'var(--bg-surface-2)',
                  border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  fontSize: 14,
                  padding: 4,
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: 'var(--danger)',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>⚠️</span> {error}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: 'var(--danger-glow)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {loading ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
