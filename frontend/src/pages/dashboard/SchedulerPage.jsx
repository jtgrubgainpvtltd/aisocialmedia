import SchedulerView from '../../components/SchedulerView'

const NAVY = '#1a2332'

export default function SchedulerPage() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.4)', marginBottom: 4 }}>03 — Schedule</p>
        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em', color: NAVY, lineHeight: 1 }}>Scheduler</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: 'rgba(12,12,12,0.5)', marginTop: 6 }}>Manage your publish schedule across all platforms.</p>
      </div>
      <SchedulerView />
    </div>
  )
}
