import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analytics, content, posts } from '../../api/client'

const TEAL = '#007A64'
const NAVY = '#1a2332'
const ORANGE = '#E8640A'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('Last 30 Days')
  const [platform, setPlatform] = useState('All Platforms')

  // ── React Query: parallel data fetching, 30s cache, 2 auto-retries ──
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['content-stats'],
    queryFn: () => content.getStats().then(r => r.data.data),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['published-posts-analytics'],
    queryFn: () => posts.getPublished({ limit: 10 }).then(r => r.data.data),
  })

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analytics.getOverview().then(r => r.data.data),
  })

  const { data: insightsData } = useQuery({
    queryKey: ['analytics-insights'],
    queryFn: () => analytics.getInsights().then(r => r.data.data).catch(() => []),
  })

  const loading = statsLoading || postsLoading || overviewLoading

  // Safe derived values — no more .toString() crashes on undefined
  const stats = statsData || { generated: 0, scheduled: 0, published: 0 }
  const overview = overviewData || { totalReach: 0, totalEngagement: 0, totalClicks: 0, totalSaves: 0, avgEngagementRate: 0 }
  const recentPosts = postsData?.posts || []
  const insights = insightsData || []


  const kpis = [
    { label: 'Content Generated', value: loading ? '...' : stats.generated, change: 'Lifetime', trend: 'up' },
    { label: 'Scheduled Posts', value: loading ? '...' : stats.scheduled, change: 'Upcoming', trend: 'up' },
    { label: 'Published Posts', value: loading ? '...' : stats.published, change: 'Lifetime', trend: 'up' },
    { label: 'Total Reach', value: loading ? '...' : overview.totalReach, change: 'Real data', trend: 'up' },
    { label: 'Link Clicks', value: loading ? '...' : overview.totalClicks, change: 'Real data', trend: 'up' },
    { label: 'Saves & Shares', value: loading ? '...' : overview.totalSaves, change: `ER ${overview.avgEngagementRate || 0}%`, trend: 'up' }
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
        <div>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.4)', marginBottom: 4 }}>Performance</p>
          <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em', color: NAVY, lineHeight: 1 }}>Analytics</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(12,12,12,0.12)', background: 'white', color: NAVY, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', outline: 'none' }}>
            {['All Platforms', 'Instagram', 'Facebook', 'WhatsApp', 'Google Business'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(12,12,12,0.12)', background: 'white', color: NAVY, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', outline: 'none' }}>
            {['Last 7 Days', 'Last 30 Days', 'This Month', 'Last Quarter'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(12,12,12,0.1)', borderRadius: 12, padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.5)', marginBottom: 12 }}>{kpi.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: NAVY }}>{kpi.value}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: kpi.trend === 'up' ? TEAL : '#d32f2f',
                background: kpi.trend === 'up' ? 'rgba(0,122,100,0.1)' : 'rgba(211,47,47,0.1)',
                padding: '2px 6px', borderRadius: 4,
              }}>
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Top Posts Table */}
        <div style={{
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(12,12,12,0.1)', borderRadius: 16, padding: '24px 0',
          overflowX: 'auto'
        }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1rem', color: NAVY, padding: '0 24px', marginBottom: 20 }}>Recent Published Posts & Performance</h3>
          
          {loading ? (
            <p style={{ padding: '0 24px', color: 'rgba(12,12,12,0.5)', fontFamily: 'Inter, sans-serif' }}>Loading data...</p>
          ) : recentPosts.length === 0 ? (
            <p style={{ padding: '0 24px', color: 'rgba(12,12,12,0.5)', fontFamily: 'Inter, sans-serif' }}>No published posts yet. Schedule or publish some content!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(12,12,12,0.08)' }}>
                  {['Post Details', 'Platform', 'Reach', 'Engagement'].map(th => (
                    <th key={th} style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.4)', padding: '0 24px 12px', fontWeight: 400 }}>{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPosts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(12,12,12,0.04)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 500, color: NAVY }}>{p.title || 'AI Generated Post'}</p>
                      <p style={{ fontSize: '0.65rem', color: 'rgba(12,12,12,0.4)', marginTop: 4 }}>
                        {new Date(p.published_date).toLocaleDateString('en-IN')} {p.published_time}
                      </p>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'rgba(12,12,12,0.7)' }}>{p.platform}</td>
                    <td style={{ padding: '16px 24px', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: NAVY }}>{p.views || '—'}</td>
                    <td style={{ padding: '16px 24px', fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: TEAL }}>{p.engagement || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* AI Insights panel */}
        <div style={{
          background: `linear-gradient(145deg, ${NAVY} 0%, #243047 100%)`, color: 'white',
          borderRadius: 16, padding: '24px', boxShadow: '0 8px 32px rgba(26,35,50,0.15)',
          height: 'max-content'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: '1.2rem' }}>🧠</span>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>AI Insights</h3>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {insights.map((insight, i) => (
              <li key={i} style={{
                fontSize: '0.8rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.75)',
                paddingLeft: 12, borderLeft: `2px solid ${ORANGE}`
              }}>
                {insight}
              </li>
            ))}
            {!loading && insights.length === 0 && (
              <li style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', paddingLeft: 12, borderLeft: `2px solid ${ORANGE}` }}>
                No insights available yet. Publish more posts to generate data-driven insights.
              </li>
            )}
          </ul>
          <button style={{
            width: '100%', marginTop: 24, padding: '10px', borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer',
            fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            transition: 'background 0.2s',
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
            Generate Full Report
          </button>
        </div>
      </div>
    </div>
  )
}
