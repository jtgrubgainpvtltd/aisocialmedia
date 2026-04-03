import AppLoader from './AppLoader'
import AppButton from './AppButton'

export default function QueryState({
  loading,
  error,
  onRetry,
  loadingTitle = 'Loading',
  loadingSubtitle = 'Fetching data…',
  empty = false,
  emptyTitle = 'No data yet',
  emptyDescription = 'Nothing to show here right now.',
  children,
}) {
  if (loading) {
    return <AppLoader title={loadingTitle} subtitle={loadingSubtitle} fullscreen={false} />
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.9rem', color: '#cc0000', marginBottom: 8 }}>
          Something went wrong
        </h3>
        <p style={{ color: 'var(--fg-dim)', marginBottom: 12, fontSize: '0.82rem' }}>
          {error?.response?.data?.error?.message || error?.message || 'Request failed'}
        </p>
        {onRetry && <AppButton onClick={onRetry}>Retry</AppButton>}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.9rem', color: 'var(--fg)', marginBottom: 8 }}>
          {emptyTitle}
        </h3>
        <p style={{ color: 'var(--fg-dim)', fontSize: '0.82rem' }}>{emptyDescription}</p>
      </div>
    )
  }

  return children
}

