import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { posts } from '../api/client'

const PlatformIcon = ({ platform }) => {
  const p = platform?.toLowerCase() || ''
  if (p.includes('instagram')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
  if (p.includes('facebook')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
  if (p.includes('twitter') || p.includes('x')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  )
}

function StatusBadge({ status }) {
  const s = status?.toUpperCase() || ''
  if (s === 'APPROVED' || s === 'PUBLISHED') return <span className="badge-approved">{status}</span>
  if (s === 'IN_REVIEW') return <span className="badge-review">Review</span>
  if (s === 'CANCELLED') return <span className="badge-cancelled" style={{ background: '#ffeeee', color: '#cc0000', padding: '4px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600 }}>Canceled</span>
  return <span className="badge-pending">{status || 'Pending'}</span>
}

const platformColors = {
  'INSTAGRAM': { color: '#e1306c', bg: 'rgba(225,48,108,0.08)' },
  'FACEBOOK': { color: '#1877f2', bg: 'rgba(24,119,242,0.08)' },
  'TWITTER': { color: '#000000', bg: 'rgba(0,0,0,0.06)' },
  'WHATSAPP': { color: '#25d366', bg: 'rgba(37,211,102,0.08)' },
}

export default function SchedulerView() {
  const [filter, setFilter] = useState('All')
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  const filters = ['All', 'PENDING', 'APPROVED', 'PUBLISHED']

  useEffect(() => {
    loadScheduledPosts()
  }, [])

  const loadScheduledPosts = async () => {
    try {
      const res = await posts.getScheduled()
      if (res.data.success) {
        setScheduledPosts(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to load scheduled posts', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'All'
    ? scheduledPosts
    : scheduledPosts.filter(p => p.status === filter)

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return
    try {
      const res = await posts.cancelScheduled(id)
      if (res.data.success) {
        setScheduledPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'CANCELLED' } : p))
      }
    } catch (err) {
      alert('Failed to cancel post')
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header with filter tabs */}
      <div
        className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{ borderBottom: '1px solid var(--border-dim)' }}
      >
        <div>
          <span
            className="block text-[0.58rem] tracking-[0.15em] uppercase mb-0.5"
            style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dim)' }}
          >
            {filtered.length} posts
          </span>
          <h3
            className="text-base font-bold"
            style={{ fontFamily: 'Unbounded, sans-serif', color: 'var(--fg)' }}
          >
            Upcoming Posts
          </h3>
        </div>
        {/* Filter tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl flex-wrap"
          style={{ background: 'rgba(12,12,12,0.05)', border: '1px solid var(--border-dim)' }}
        >
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[0.58rem] tracking-wider uppercase transition-all duration-150 cursor-pointer border-none"
              style={{
                fontFamily: 'Space Mono, monospace',
                background: filter === f ? 'var(--teal)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--fg-dim)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center" style={{ color: 'var(--fg-dim)', fontFamily: 'Inter, sans-serif' }}>
          Loading scheduled posts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
          <p style={{ color: 'var(--fg-dim)', fontFamily: 'Inter, sans-serif' }}>No posts scheduled yet.</p>
          <Link to="/dashboard/studio" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to Studio to Schedule</Link>
        </div>
      ) : (
        <>
          {/* Table (desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="scheduler-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Platform</th>
                  <th>Caption</th>
                  <th>Est. Reach</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post, i) => (
                  <tr key={post.id} style={{ animationDelay: `${i * 50}ms`, opacity: 1 }}>
                    <td>
                      <div>
                        <p className="font-medium text-[0.8rem]" style={{ color: 'var(--fg)', fontFamily: 'Inter, sans-serif' }}>
                          {new Date(post.scheduled_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[0.62rem] mt-0.5" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--teal)' }}>
                          {post.scheduled_time}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span
                        className="flex items-center gap-2 text-[0.7rem] font-medium px-2 py-1 rounded-lg w-fit"
                        style={{
                          color: platformColors[post.platform]?.color || 'var(--fg)',
                          background: platformColors[post.platform]?.bg || 'var(--border-dim)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <PlatformIcon platform={post.platform} />
                        {post.platform}
                      </span>
                    </td>
                    <td>
                      <span
                        className="text-[0.72rem] line-clamp-1"
                        style={{ color: 'var(--fg-dim)', fontFamily: 'Inter, sans-serif', maxWidth: 280, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {post.caption || (post.content && post.content.caption_english) || 'No caption'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.7rem', color: 'var(--fg-dim)' }}>
                        {post.estimated_reach ? `~${(post.estimated_reach / 1000).toFixed(1)}K` : '—'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={post.status} />
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {post.status !== 'CANCELLED' && post.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleCancel(post.id)}
                            className="text-[0.58rem] tracking-wider uppercase px-2.5 py-1.5 rounded-lg cursor-pointer border-none transition-all duration-150"
                            style={{ fontFamily: 'Space Mono, monospace', color: '#cc0000', background: 'rgba(204,0,0,0.08)' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden flex flex-col">
            {filtered.map(post => (
              <div
                key={post.id}
                className="px-4 py-4 flex flex-col gap-2"
                style={{ borderBottom: '1px solid var(--border-dim)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="flex items-center gap-1.5 text-[0.62rem] mb-1 px-2 py-0.5 rounded"
                      style={{ color: platformColors[post.platform]?.color || 'var(--fg)', background: platformColors[post.platform]?.bg || 'var(--border-dim)', fontFamily: 'Inter, sans-serif', width: 'fit-content' }}
                    >
                      <PlatformIcon platform={post.platform} />
                      {post.platform}
                    </span>
                    <p className="text-[0.62rem] mt-0.5" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--teal)' }}>
                      {new Date(post.scheduled_date).toLocaleDateString('en-IN')} · {post.scheduled_time}
                    </p>
                  </div>
                  <StatusBadge status={post.status} />
                </div>
                <p className="text-[0.72rem]" style={{ color: 'var(--fg-dim)', fontFamily: 'Inter, sans-serif' }}>
                  {post.caption || (post.content && post.content.caption_english) || 'No caption'}
                </p>
                {post.status !== 'CANCELLED' && post.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => handleCancel(post.id)}
                    className="mt-2 text-[0.6rem] tracking-wider uppercase px-3 py-1.5 rounded-lg cursor-pointer border-none transition-all w-fit"
                    style={{ fontFamily: 'Space Mono, monospace', color: '#cc0000', background: 'rgba(204,0,0,0.08)' }}
                  >
                    Cancel Post
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border-dim)', background: 'rgba(0,122,100,0.02)' }}
      >
        <span className="text-[0.58rem]" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dimmer)' }}>
          Showing {filtered.length} posts
        </span>
        <Link
          to="/dashboard/studio"
          className="text-[0.62rem] tracking-wider uppercase px-4 py-2 rounded-lg cursor-pointer border-none font-semibold transition-all duration-150 text-center"
          style={{ fontFamily: 'Space Mono, monospace', color: '#fff', background: 'var(--teal)', textDecoration: 'none' }}
        >
          + New Post
        </Link>
      </div>
    </div>
  )
}
