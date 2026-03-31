import { useErrorBoundary } from 'react-error-boundary'

/**
 * Premium error fallback UI shown when any child component crashes.
 * The sidebar + navigation remain alive since this only wraps <Outlet />.
 */
export function PageErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: 400, padding: '40px 24px', textAlign: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fff0ee, #ffe0dc)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 8px 32px rgba(255,80,60,0.15)'
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF503C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      {/* Heading */}
      <h2 style={{
        fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.1rem',
        color: '#0C0C0C', marginBottom: 8, letterSpacing: '-0.02em'
      }}>
        Something went wrong
      </h2>

      {/* Subtitle */}
      <p style={{ color: '#475569', fontSize: '0.85rem', maxWidth: 380, lineHeight: 1.6, marginBottom: 8 }}>
        This page encountered an unexpected error. The rest of your dashboard is unaffected.
      </p>

      {/* Error detail (collapsed, dev-friendly) */}
      <details style={{ marginBottom: 24, cursor: 'pointer' }}>
        <summary style={{ color: '#94A3B8', fontSize: '0.72rem', userSelect: 'none' }}>
          Show error details
        </summary>
        <pre style={{
          marginTop: 8, padding: '10px 14px', background: '#F1F5F9',
          borderRadius: 8, fontSize: '0.7rem', color: '#64748B',
          textAlign: 'left', maxWidth: 480, overflowX: 'auto',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word'
        }}>
          {error?.message || String(error)}
        </pre>
      </details>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={resetErrorBoundary}
          style={{
            padding: '10px 22px', borderRadius: 8, border: 'none',
            background: '#FF503C', color: 'white', cursor: 'pointer',
            fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.62rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(255,80,60,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '10px 22px', borderRadius: 8,
            border: '1px solid rgba(12,12,12,0.15)',
            background: 'white', color: '#475569', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.8rem',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export default PageErrorFallback
