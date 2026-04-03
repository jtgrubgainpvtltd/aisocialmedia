import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(0,122,100,0.16), rgba(0,122,100,0))',
          top: '-120px',
          right: '-120px',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(232,100,10,0.12), rgba(232,100,10,0))',
          bottom: '-120px',
          left: '-80px',
          pointerEvents: 'none',
        }}
      />

      <div className="glass-card" style={{ width: 'min(94vw, 700px)', padding: '34px 30px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(0,122,100,0.08)', border: '1px solid rgba(0,122,100,0.15)', marginBottom: 14 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)' }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.16em', color: 'var(--teal)' }}>
            ERROR 404
          </span>
        </div>

        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '1.5rem', color: 'var(--fg)', marginBottom: 10, lineHeight: 1.2 }}>
          Oops — this page took a wrong turn
        </h1>

        <p style={{ color: 'var(--fg-dim)', fontSize: '0.9rem', margin: '0 auto 18px', maxWidth: 520, lineHeight: 1.6 }}>
          The URL might be broken, outdated, or the page was moved while we were improving your dashboard experience.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid transparent', background: 'var(--teal)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
              Go to Dashboard
            </button>
          </Link>
          <Link to="/dashboard/studio" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Open Content Studio
            </button>
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Go Home
            </button>
          </Link>
        </div>

        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'rgba(12,12,12,0.45)' }}>
          Tip: check the URL path or use the sidebar navigation to continue.
        </p>
      </div>
    </div>
  )
}

