import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { trends } from '../../api/client' // Ensure your backend routes this to getRestaurantCityFeed
import AppLoader from '../../components/ui/AppLoader'

const TEAL = '#007A64'
const NAVY = '#1a2332'

const impactColors = {
  high:   { color: TEAL,  bg: 'rgba(0,122,100,0.08)',  border: 'rgba(0,122,100,0.2)' },
  medium: { color: '#b07d00', bg: 'rgba(176,125,0,0.08)', border: 'rgba(176,125,0,0.2)' },
  low:    { color: 'rgba(12,12,12,0.4)', bg: 'rgba(12,12,12,0.04)', border: 'rgba(12,12,12,0.1)' },
}

const tabs = ['All', 'Events', 'Weather', 'Sports', 'Festival Calendar', 'Local Insights']

const SUPPORTED_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 
  'Chennai', 'Kolkata', 'Ahmedabad'
]

const getIcon = (type) => {
  if (type === 'Local Insights' || type === 'google') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
  if (type === 'Weather' || type === 'weather') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><path d="M8 22v-4"/><path d="M12 22v-4"/><path d="M16 22v-4"/></svg>
  if (type === 'Sports' || type === 'sport') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M5.4 5.4l13.2 13.2"/><path d="M18.6 5.4L5.4 18.6"/></svg>
  if (type === 'Events' || type === 'Festival Calendar' || type === 'event') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}

const getIconBg = (type) => {
  if (type === 'Weather' || type === 'weather') return 'rgba(37,99,235,0.08)'
  if (type === 'Sports' || type === 'sport') return 'rgba(234,88,12,0.08)'
  if (type === 'Events' || type === 'Festival Calendar' || type === 'event') return 'rgba(147,51,234,0.08)'
  return 'rgba(0,122,100,0.08)'
}

export default function CityFeed() {
  const { user } = useAuth()
  
  // Dynamic Initial City
  const initialCity = user?.city || user?.restaurant?.city || SUPPORTED_CITIES[0]
  
  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [activeTab, setActiveTab] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)

  const cuisine = user?.cuisine_type || user?.restaurant?.cuisine_type || 'Food'

  // Trigger refetch whenever selectedCity changes
  useEffect(() => {
    fetchTrends(selectedCity)
  }, [selectedCity])

  const fetchTrends = async (cityToFetch) => {
    try {
      setLoading(true)
      const res = await trends.getCityTrends(cityToFetch)
      if (res.data?.success && res.data?.data?.length > 0) {
        setFeedItems(res.data.data)
      } else {
        setFeedItems([])
      }
    } catch (err) {
      console.error('Failed to fetch City Feed Data', err)
      setFeedItems([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = activeTab === 'All'
    ? feedItems
    : feedItems.filter(f => f.type?.toLowerCase() === activeTab.toLowerCase())

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em', color: NAVY, lineHeight: 1 }}>{selectedCity} Feed</h1>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        
        {/* Dynamic City Selector */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              padding: '8px 32px 8px 12px', borderRadius: 8,
              border: '1px solid rgba(12,12,12,0.2)',
              background: 'white', color: NAVY, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 600,
              appearance: 'none', outline: 'none'
            }}
          >
            {!SUPPORTED_CITIES.includes(initialCity) && (
               <option value={initialCity}>{initialCity}</option>
            )}
            {SUPPORTED_CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.8 }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        {/* Feed type tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '4px', background: 'rgba(12,12,12,0.05)', borderRadius: 10, border: '1px solid rgba(12,12,12,0.08)' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '6px 14px', borderRadius: 7, border: 'none',
              background: activeTab === t ? TEAL : 'transparent',
              color: activeTab === t ? 'white' : 'rgba(12,12,12,0.6)',
              cursor: 'pointer', fontFamily: 'Space Mono, monospace',
              fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'all 0.15s', fontWeight: activeTab === t ? 'bold' : 'normal',
              whiteSpace: 'nowrap'
            }}>{t}</button>
          ))}
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>Live AI Triggers</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '8px 0 14px' }}>
          <AppLoader
            fullscreen={false}
            title={`Loading ${selectedCity} feed`}
            subtitle="Fetching real-time hyper-local signals and trends…"
          />
        </div>
      ) : (
        /* Feed cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '20px', borderRadius: 12, border: '1px solid rgba(12,12,12,0.1)', background: 'rgba(255,255,255,0.7)' }}>
              <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', color: 'rgba(12,12,12,0.6)' }}>
                No active {activeTab.toLowerCase()} data available for {selectedCity} right now.
              </p>
              <button onClick={() => fetchTrends(selectedCity)} style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, border: 'none', background: TEAL, color: 'white', cursor: 'pointer' }}>
                Refresh Feed
              </button>
            </div>
          )}
          {filtered.map(item => {
            const ic = impactColors[item.impact] || impactColors.low
            const isExpanded = expanded === item.id
            const studioUrl = `/dashboard/studio?prompt=${encodeURIComponent(`Create an engaging social media post. Highlight that ${item.title}. The goal is: ${item.angle}. Ensure it perfectly matches our ${cuisine} restaurant branding.`)}`

            return (
              <div key={item.id} style={{
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(12,12,12,0.1)', borderRadius: 14,
                overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s',
              }}>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: getIconBg(item.type),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{getIcon(item.type)}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: NAVY, marginBottom: 6, lineHeight: 1.3 }}>
                        {item.title}
                      </h3>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.08em', color: 'rgba(12,12,12,0.4)', textTransform: 'uppercase' }}>
                          [{item.source}]
                        </span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(12,12,12,0.2)', display: 'inline-block' }} />
                        <span style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '0.54rem', letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: ic.color,
                          background: ic.bg, border: `1px solid ${ic.border}`,
                          padding: '2px 8px', borderRadius: 4, fontWeight: 'bold'
                        }}>{item.impact} IMPACT</span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: 'rgba(12,12,12,0.5)', letterSpacing: '0.06em' }}>
                          Strategy: {item.angle}
                        </span>
                      </div>
                      {isExpanded && (
                        <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'rgba(12,12,12,0.7)', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>
                          {item.detail}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      <button onClick={() => setExpanded(isExpanded ? null : item.id)} style={{
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid rgba(12,12,12,0.12)', background: isExpanded ? 'rgba(12,12,12,0.05)' : 'transparent',
                        fontFamily: 'Space Mono, monospace', fontSize: '0.56rem',
                        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.6)', transition: 'all 0.1s'
                      }}>{isExpanded ? 'Less' : 'Details'}</button>
                      <Link to={studioUrl} style={{
                        padding: '8px 16px', borderRadius: 8, cursor: 'pointer', textDecoration: 'none',
                        border: 'none', background: 'linear-gradient(135deg, var(--teal) 0%, #00a486 100%)',
                        fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', fontWeight: 600,
                        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white',
                        boxShadow: '0 4px 12px rgba(0,122,100,0.25)', display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Create Post
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <style>{`.blink { animation: blink 1.8s ease-in-out infinite; } @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
    </div>
  )
}
