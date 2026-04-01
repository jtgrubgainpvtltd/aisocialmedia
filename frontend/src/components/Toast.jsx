import { useState, useCallback } from 'react';

/**
 * useToast — lightweight in-app toast notifications.
 * Replaces all browser alert() calls with non-blocking UI feedback.
 *
 * Usage:
 *   const { toasts, toast } = useToast();
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.info('Post scheduled');
 *
 * Render <ToastContainer toasts={toasts} /> anywhere in the tree.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warn: (msg) => addToast(msg, 'warn'),
  };

  return { toasts, toast };
}

const TOAST_STYLES = {
  success: { bg: '#16a34a', icon: '✓' },
  error:   { bg: '#dc2626', icon: '✕' },
  warn:    { bg: '#d97706', icon: '⚠' },
  info:    { bg: '#007a64', icon: 'ℹ' },
};

/**
 * ToastContainer — renders toasts in the top-right corner.
 * Add once near the top of a page/layout component.
 */
export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => {
        const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 18px',
              borderRadius: 10,
              background: style.bg,
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 500,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              maxWidth: 360,
              animation: 'grubgain-toast-in 0.25s ease',
              pointerEvents: 'auto',
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{style.icon}</span>
            <span>{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes grubgain-toast-in {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </div>
  );
}
