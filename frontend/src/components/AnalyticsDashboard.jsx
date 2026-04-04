import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { content, analytics } from '../api/client'
import QueryState from './ui/QueryState'
import { useIsSmallScreen } from '../utils/useIsSmallScreen'

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

function RecentContentCard({ items, onView, style }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(12,12,12,0.1)', borderRadius: 12, padding: '20px 24px', ...style }}>
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
            <button
              type="button"
              onClick={() => onView(item)}
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.58rem',
                color: TEAL,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid rgba(0,122,100,0.3)',
                background: 'transparent',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              View
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
    </div>
  )
}

function WowHero({ stats, overview, isMobile }) {
  const score = Math.min(
    100,
    Math.round((Number(overview.totalEngagement || 0) / Math.max(1, Number(overview.totalReach || 1))) * 1000)
  )

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 14,
      padding: isMobile ? '16px 20px' : '22px 24px',
      background: 'linear-gradient(120deg, #1a2332 0%, #22344b 55%, #007A64 100%)',
      color: 'white',
      boxShadow: '0 10px 28px rgba(26,35,50,0.22)',
    }}>
      <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ paddingRight: isMobile ? 0 : 20 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>
            Momentum Signal
          </span>
          <h3 style={{ marginTop: 8, fontFamily: 'Unbounded, sans-serif', fontSize: isMobile ? '1rem' : '1.2rem', lineHeight: 1.3 }}>
            You generated {stats.generated || 0} assets and published {stats.published || 0} posts.
          </h3>
          <p style={{ marginTop: 8, opacity: 0.82, fontSize: '0.82rem' }}>
            Keep cadence steady this week to compound reach and engagement.
          </p>
        </div>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', opacity: 0.8, marginBottom: 8 }}>Health Score</div>
          <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '2rem', lineHeight: 1 }}>{score}</div>
          <div style={{ marginTop: 10, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${score}%`, background: '#E8640A', borderRadius: 99, transition: 'width 0.7s' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const navigate = useNavigate()
  const isMobile = useIsSmallScreen()
  // ── React Query: replaces useState + useEffect + manual loading/error ──
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['content-stats'],
    queryFn: () => content.getStats().then(r => r.data.data),
  })

  const { data: historyData, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['content-history-recent'],
    queryFn: () => content.getHistory({ limit: 5 }).then(r => r.data.data),
  })

  const { data: overviewData, error: overviewError, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analytics.getOverview().then(r => r.data.data),
  })

  const loading = statsLoading || historyLoading

  const stats = statsData || { generated: 0, scheduled: 0, published: 0 }
  const overview = overviewData || { totalReach: 0, totalEngagement: 0 }

  const recentContent = (historyData?.content || []).map(c => ({
    id: String(c.id),
    title: (c.caption_english || '').substring(0, 50) + ((c.caption_english || '').length > 50 ? '...' : ''),
    fullCaption: c.caption_english || c.caption_hindi || '',
    imageUrl: c.image_url || '',
    platform: c.platform || 'INSTAGRAM',
    meta: `Generated ${new Date(c.created_on).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
  }))

  const handleViewPost = (post) => {
    navigate('/dashboard/studio', {
      state: {
        historyEditPayload: {
          caption: post.fullCaption || '',
          imageUrl: post.imageUrl || '',
          platform: post.platform || 'INSTAGRAM',
          postId: String(post.id),
        },
      },
    })
  }

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
    <QueryState
      loading={loading}
      error={statsError || historyError || overviewError}
      onRetry={() => {
        refetchStats()
        refetchHistory()
        refetchOverview()
      }}
      loadingTitle="Loading analytics"
      loadingSubtitle="Crunching performance metrics…"
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <WowHero stats={stats} overview={overview} isMobile={isMobile} />

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {metrics.map((metric, i) => (
          <MetricCard key={i} metric={metric} delay={i * 100} />
        ))}
      </div>

      {/* Chart + Recent Content */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, alignItems: 'stretch', width: '100%' }}>
        <div style={{ flex: isMobile ? 'none' : '1.7', width: isMobile ? '100%' : 'auto', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(12,12,12,0.1)', borderRadius: 12, padding: '20px 24px', boxSizing: 'border-box' }}>
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

          <div style={{ marginTop: 16, borderTop: '1px solid rgba(12,12,12,0.08)', paddingTop: 14 }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.45)', display: 'block', marginBottom: 10 }}>
              Recent Momentum
            </span>
            {recentContent.length === 0 ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: 'rgba(12,12,12,0.45)' }}>
                Publish a few posts to unlock timeline momentum here.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                {recentContent.slice(0, 4).map((item, idx) => (
                  <div key={`${item.title}-${idx}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minWidth: 0 }}>
                    <span style={{ marginTop: 4, width: 7, height: 7, borderRadius: '50%', background: TEAL, boxShadow: '0 0 0 4px rgba(0,122,100,0.12)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.74rem', color: '#1a2332', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: '0.62rem', color: 'rgba(12,12,12,0.45)', marginTop: 2 }}>{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <RecentContentCard items={recentContent} onView={handleViewPost} style={{ flex: isMobile ? 'none' : '1', width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }} />
      </div>
    </div>
    </QueryState>
  )
}
