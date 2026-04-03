export default function AppLoader({
  title = 'Loading',
  subtitle = 'Please wait a moment…',
  fullscreen = true,
}) {
  return (
    <div
      style={{
        minHeight: fullscreen ? '100vh' : 220,
        display: 'grid',
        placeItems: 'center',
        background: fullscreen ? 'var(--bg)' : 'transparent',
      }}
    >
      <div className="glass-card" style={{ width: 'min(92vw, 460px)', padding: '28px 24px', textAlign: 'center' }}>
        <div
          aria-hidden
          style={{
            width: 74,
            height: 74,
            margin: '0 auto 14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(0,122,100,0.25), rgba(0,122,100,0.08))',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div className="app-loader-ring" />
        </div>
        <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.95rem', color: 'var(--fg)', marginBottom: 6 }}>
          {title}
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: 'var(--fg-dim)' }}>{subtitle}</p>
      </div>
    </div>
  )
}

