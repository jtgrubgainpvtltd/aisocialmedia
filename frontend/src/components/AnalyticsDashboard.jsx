import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { content, analytics } from '../api/client'

const TEAL = '#007A64'

function MetricCard({ metric, delay }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(12,12,12,0.1)', borderRadius: 12,
        padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: 12,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.5)' }}>
          {metric.label}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,100,0.1)', color: TEAL }}>
          {metric.icon}
        </span>
      </div>
      <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '2.4rem', color: TEAL, lineHeight: 1 }}>
        {metric.value}
      </div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'rgba(12,12,12,0.4)', borderTop: '1px solid rgba(12,12,12,0.08)', paddingTop: 10 }}>
        {metric.trend}
      </div>
    </div>
  )
}

function RecentContentCard({ items }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(12,12,12,0.1)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.5)', display: 'block', marginBottom: 6 }}>
            City Feed
          </span>
          <h3 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--fg, #1a2332)' }}>
            Recent Content
          </h3>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TEAL, animation: 'blink 1.8s infinite' }} />
          Live
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 ? (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: 'rgba(12,12,12,0.4)', padding: '12px 0' }}>No content generated yet. Head to Content Studio!</p>
        ) : items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(0,122,100,0.04)', border: '1px solid rgba(12,12,12,0.06)', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', color: 'var(--fg, #1a2332)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', color: 'rgba(12,12,12,0.4)' }}>
                {item.meta}
              </span>
            </div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6, border: `1px solid rgba(0,122,100,0.3)`, flexShrink: 0, cursor: 'pointer' }}>
              View
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
    </div>
  )
}

export default function AnalyticsDashboard() {
  // ── React Query: replaces useState + useEffect + manual loading/error ──
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['content-stats'],
    queryFn: () => content.getStats().then(r => r.data.data),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['content-history-recent'],
    queryFn: () => content.getHistory({ limit: 5 }).then(r => r.data.data),
  })

  const { data: overviewData } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analytics.getOverview().then(r => r.data.data),
  })

  const loading = statsLoading || historyLoading

  const stats = statsData || { generated: 0, scheduled: 0, published: 0 }
  const overview = overviewData || { totalReach: 0, totalEngagement: 0 }

  const recentContent = (historyData?.content || []).map(c => ({
    title: (c.caption_english || '').substring(0, 50) + ((c.caption_english || '').length > 50 ? '...' : ''),
    meta: `Generated ${new Date(c.created_on).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} · GPT-4o-mini`
  }))

  const metrics = [
    {
      label: 'Content Generated', value: loading ? '—' : String(stats.generated ?? 0),
      trend: 'AI-powered captions + images',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
    {
      label: 'Scheduled', value: loading ? '—' : String(stats.scheduled ?? 0),
      trend: 'Upcoming posts',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      label: 'Published', value: loading ? '—' : String(stats.published ?? 0),
      trend: 'Posts sent to platforms',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      label: 'Total Reach', value: loading ? '—' : String(overview.totalReach ?? 0),
      trend: 'Real post views',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {metrics.map((metric, i) => (
          <MetricCard key={i} metric={metric} delay={i * 100} />
        ))}
      </div>

      {/* Chart + Recent Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(12,12,12,0.1)', borderRadius: 12, padding: '20px 24px' }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.5)', display: 'block', marginBottom: 16 }}>
            Content Generation Activity
          </span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
            {Array.from({ length: 14 }, (_, i) => {
              const h = stats.generated > 0 ? Math.min(95, (stats.generated * 10) / (i + 1)) : 0
              return (
                <div key={i} style={{
                  flex: 1, borderRadius: 2,
                  height: `${h}%`,
                  background: i === 13 ? TEAL : 'rgba(0,122,100,0.15)',
                  transition: 'height 0.7s',
                  minWidth: 0,
                }} />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', color: 'rgba(12,12,12,0.3)' }}>2 weeks ago</span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', color: 'rgba(12,12,12,0.3)' }}>Today</span>
          </div>
        </div>
        <RecentContentCard items={recentContent} />
      </div>
    </div>
  )
}
