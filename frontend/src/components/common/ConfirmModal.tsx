// src/components/common/ConfirmModal.tsx
import React, { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Tasdiqlash',
  message,
  confirmText = 'Ha, davom etish',
  cancelText = 'Bekor qilish',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      confirmBtnRef.current?.focus();
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [open, onCancel]);

  if (!open) return null;

  const iconMap = {
    danger: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="var(--c-danger, #ef4444)" strokeWidth="2" />
        <path d="M12 8v4M12 16h.01" stroke="var(--c-danger, #ef4444)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    warning: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--c-warning, #f59e0b)" strokeWidth="2" />
        <path d="M12 9v4M12 17h.01" stroke="var(--c-warning, #f59e0b)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    info: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="var(--c-info, #3b82f6)" strokeWidth="2" />
        <path d="M12 16v-4M12 8h.01" stroke="var(--c-info, #3b82f6)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  const colorMap = {
    danger: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', btn: '#ef4444', btnHover: '#dc2626' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', btn: '#f59e0b', btnHover: '#d97706' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', btn: '#3b82f6', btnHover: '#2563eb' },
  };

  const colors = colorMap[variant];

  return (
    <div
      ref={overlayRef}
      className="confirm-modal-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'confirmFadeIn 0.18s ease-out',
      }}
    >
      <div
        className="confirm-modal-card"
        style={{
          background: 'var(--bg-surface, #111827)',
          border: '1.5px solid var(--border, #1e293b)',
          borderRadius: 16,
          padding: '28px 28px 22px',
          maxWidth: 420,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'confirmSlideUp 0.2s ease-out',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {iconMap[variant]}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-pri, #fff)',
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: 'var(--f-disp, sans-serif)',
          }}
        >
          {title}
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-sec, #94a3b8)',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          {message}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: '1.5px solid var(--border, #1e293b)',
              background: 'transparent',
              color: 'var(--text-sec, #94a3b8)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--f-ui, sans-serif)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border, #1e293b)';
            }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: colors.btn,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--f-ui, sans-serif)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.btnHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.btn;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
