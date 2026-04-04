import AnalyticsDashboard from '../../components/AnalyticsDashboard'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useIsSmallScreen } from '../../utils/useIsSmallScreen'

const TEAL = '#007A64'
const NAVY = '#1a2332'

export default function OverviewDashboard() {
  const { user } = useAuth()
  const isMobile = useIsSmallScreen()

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 1400 }}>

      {/* Section header */}
      <div style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: isMobile ? '1.2rem' : '1.6rem', letterSpacing: '-0.03em', color: NAVY, lineHeight: 1.2 }}>
            Welcome back, {user?.restaurant?.name || user?.restaurantName || 'Partner'}
          </h1>
        </div>
      </div>

      {/* Analytics cards (now dynamic) */}
      <AnalyticsDashboard />
    </div>
  )
}
