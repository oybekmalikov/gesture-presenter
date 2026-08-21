// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { Ban, Check, Info, TriangleAlert, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastMessage = string | { uz?: string; ru?: string;[key: string]: any };

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: ToastMessage, title?: string, duration?: number) => void;
  success: (message: ToastMessage, title?: string, duration?: number) => void;
  error: (message: ToastMessage, title?: string, duration?: number) => void;
  warning: (message: ToastMessage, title?: string, duration?: number) => void;
  info: (message: ToastMessage, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { language } = useLanguage();

  const resolveMessage = useCallback(
    (msg: ToastMessage): string => {
      if (typeof msg === 'string') return msg;
      if (!msg) return '';
      if (language === 'ru' && msg.ru) return msg.ru;
      if (msg.uz) return msg.uz;
      if (msg.ru) return msg.ru;
      return Object.values(msg)[0] || '';
    },
    [language],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: ToastMessage, title?: string, duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const resolvedText = resolveMessage(message);

      const defaultTitles: Record<ToastType, { uz: string; ru: string }> = {
        success: { uz: 'Muvaffaqiyatli', ru: 'Успешно' },
        error: { uz: 'Xatolik', ru: 'Ошибка' },
        warning: { uz: 'Diqqat', ru: 'Внимание' },
        info: { uz: "Ma'lumot", ru: 'Информация' },
      };

      const resolvedTitle =
        title || (language === 'ru' ? defaultTitles[type].ru : defaultTitles[type].uz);

      const newToast: ToastItem = {
        id,
        type,
        title: resolvedTitle,
        message: resolvedText,
        duration,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [resolveMessage, removeToast, language],
  );

  const success = useCallback(
    (msg: ToastMessage, title?: string, dur?: number) => showToast('success', msg, title, dur),
    [showToast],
  );

  const error = useCallback(
    (msg: ToastMessage, title?: string, dur?: number) => showToast('error', msg, title, dur),
    [showToast],
  );

  const warning = useCallback(
    (msg: ToastMessage, title?: string, dur?: number) => showToast('warning', msg, title, dur),
    [showToast],
  );

  const info = useCallback(
    (msg: ToastMessage, title?: string, dur?: number) => showToast('info', msg, title, dur),
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, warning, info, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  const typeStyles: Record<
    ToastType,
    { icon: React.ReactNode; border: string; bg: string; iconColor: string; titleColor: string }
  > = {
    success: {
      icon: <Check size={16} />,
      border: 'rgba(16, 185, 129, 0.4)',
      bg: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
      titleColor: '#10b981',
    },
    error: {
      icon: <Ban size={16} />,
      border: 'rgba(239, 68, 68, 0.4)',
      bg: 'rgba(239, 68, 68, 0.12)',
      iconColor: '#ef4444',
      titleColor: '#ef4444',
    },
    warning: {
      icon: <TriangleAlert size={16} />,
      border: 'rgba(245, 158, 11, 0.4)',
      bg: 'rgba(245, 158, 11, 0.12)',
      iconColor: '#f59e0b',
      titleColor: '#f59e0b',
    },
    info: {
      icon: <Info size={16} />,
      border: 'rgba(59, 130, 246, 0.4)',
      bg: 'rgba(59, 130, 246, 0.12)',
      iconColor: '#3b82f6',
      titleColor: '#3b82f6',
    },
  };

return (
  <div
    style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      pointerEvents: 'none',
      maxWidth: 380,
      width: 'calc(100% - 40px)',
    }}
  >
    {toasts.map((t) => {
      const style = typeStyles[t.type];
      return (
        <div
          key={t.id}
          style={{
            pointerEvents: 'auto',
            background: 'var(--bg-surface, #0f172a)',
            border: `1.5px solid ${style.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(12px)',
            animation: 'toastSlideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: style.bg,
              border: `1px solid ${style.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: style.iconColor,
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {style.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
            {t.title && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: style.titleColor,
                  marginBottom: 2,
                }}
              >
                {t.title}
              </div>
            )}
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-pri, #e2e8f0)',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {t.message}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemove(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              fontSize: 14,
              padding: '2px 4px',
              lineHeight: 1,
              borderRadius: 4,
            }}
          >
            <X size={14} />
          </button>
        </div>
      );
    })}

    <style>{`
        @keyframes toastSlideInRight {
          from {
            opacity: 0;
            transform: translateX(60px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
  </div>
);
};
