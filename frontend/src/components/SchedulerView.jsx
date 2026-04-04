import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { posts } from '../api/client'
import { useToast, ToastContainer } from './Toast'
import { useAuth } from '../context/AuthContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resolveMediaUrl } from '../utils/mediaUrl'
import QueryState from './ui/QueryState'
import AppButton from './ui/AppButton'
import AppCard from './ui/AppCard'
import SecureImage from './ui/SecureImage'
import {
  PreviewInstagramPost,
  PreviewTwitter,
  PreviewFacebook,
  PreviewWhatsApp
} from './SocialPreviews'



const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
  </svg>
)

const PlatformIcon = ({ platform }) => {
  const p = platform?.toLowerCase() || ''
  if (p.includes('instagram')) return <InstagramIcon />
  if (p.includes('facebook')) return <FacebookIcon />
  if (p.includes('twitter') || p.includes('x')) return <XIcon />
  if (p.includes('whatsapp')) return <span>💬</span>
  return <span>•</span>
}

function StatusBadge({ status }) {
  const s = status?.toUpperCase() || ''
  if (s === 'APPROVED') return <span className="badge-approved">✓ Approved</span>
  if (s === 'PUBLISHED') return <span className="badge-approved">✓ Published</span>
  if (s === 'IN_REVIEW') return <span className="badge-review">◔ In review</span>
  if (s === 'CANCELLED') return <span className="badge-cancelled" style={{ background: '#ffeeee', color: '#cc0000', padding: '4px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600 }}>✕ Canceled</span>
  return <span className="badge-pending">◌ {status || 'Pending'}</span>
}

const platformColors = {
  INSTAGRAM: { color: '#e1306c', bg: 'rgba(225,48,108,0.08)' },
  FACEBOOK: { color: '#1877f2', bg: 'rgba(24,119,242,0.08)' },
  TWITTER: { color: '#000000', bg: 'rgba(0,0,0,0.06)' },
  WHATSAPP: { color: '#25d366', bg: 'rgba(37,211,102,0.08)' },
  'GOOGLE BUSINESS': { color: '#4285f4', bg: 'rgba(66,133,244,0.08)' }
}

const resolveImageUrl = (post) => {
  const candidates = [post?.image_url, post?.content?.image_url].filter((v) => typeof v === 'string' && v.trim())
  if (candidates.length === 0) return null

  // Try shared resolver first — handles localhost rewriting, relative paths, absolute URLs
  const primary = resolveMediaUrl(candidates[0])
  if (primary) return primary

  // Hard fallback: extract /uploads/... path and resolve it
  const raw = candidates[0].replace(/\\/g, '/').trim()
  const uploads = raw.match(/\/uploads\/[^?#]*/i)
  return resolveMediaUrl(uploads?.[0] ?? raw)
}

const resolveLogoUrl = (logoUrl) => {
  if (!logoUrl || typeof logoUrl !== 'string') return ''
  return resolveMediaUrl(logoUrl)
}

export default function SchedulerView() {
  const { user } = useAuth()
  const { toasts, toast } = useToast()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState('All')
  const [viewMode, setViewMode] = useState('list')
  const [selectedPost, setSelectedPost] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [saving, setSaving] = useState(false)

  const filters = ['All', 'PENDING', 'APPROVED', 'PUBLISHED']

  const {
    data: scheduledPosts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['posts-scheduled'],
    queryFn: async () => {
      const res = await posts.getScheduled()
      if (!res.data?.success) return []
      return res.data.data || []
    },
  })

  const filtered = useMemo(
    () => (filter === 'All' ? scheduledPosts : scheduledPosts.filter((p) => p.status === filter)),
    [filter, scheduledPosts],
  )

  const cancelMutation = useMutation({
    mutationFn: (id) => posts.cancelScheduled(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['posts-scheduled'], (prev = []) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'CANCELLED' } : p)),
      )
      toast.success('Scheduled post canceled')
    },
    onError: () => {
      toast.error('Failed to cancel post')
    },
  })

  const handleView = (post) => {
    setSelectedPost(post)
    setShowViewModal(true)
  }

  const handleEdit = (post) => {
    setSelectedPost(post)
    setEditCaption(post.caption || post.content?.caption_english || '')
    setEditDate(new Date(post.scheduled_date).toISOString().split('T')[0])
    setEditTime(post.scheduled_time || '18:00')
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      queryClient.setQueryData(['posts-scheduled'], (prev = []) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? { ...p, caption: editCaption, scheduled_date: editDate, scheduled_time: editTime }
            : p,
        ),
      )
      toast.success('Post updated successfully')
      setShowEditModal(false)
    } catch (err) {
      toast.error('Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) return
    cancelMutation.mutate(id)
  }

  return (
    <>
      <AppCard>
        <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border-dim)' }}>
          <div>
            <span className="block text-[0.58rem] tracking-[0.15em] uppercase mb-0.5" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dim)' }}>
              {filtered.length} posts
            </span>
            <h3 className="text-base font-bold" style={{ fontFamily: 'Unbounded, sans-serif', color: 'var(--fg)' }}>
              Upcoming Posts
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(12,12,12,0.05)', border: '1px solid var(--border-dim)' }}>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Switch to list view"
                aria-pressed={viewMode === 'list'}
                className="p-2 rounded-lg transition-all duration-150 cursor-pointer border-none flex items-center justify-center"
                style={{ background: viewMode === 'list' ? 'var(--teal)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--fg-dim)', width: 34, height: 34 }}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Switch to grid view"
                aria-pressed={viewMode === 'grid'}
                className="p-2 rounded-lg transition-all duration-150 cursor-pointer border-none flex items-center justify-center"
                style={{ background: viewMode === 'grid' ? 'var(--teal)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--fg-dim)', width: 34, height: 34 }}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>
            <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: 'rgba(12,12,12,0.05)', border: '1px solid var(--border-dim)' }}>
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-[0.58rem] tracking-wider uppercase transition-all duration-150 cursor-pointer border-none"
                  style={{ fontFamily: 'Space Mono, monospace', background: filter === f ? 'var(--teal)' : 'transparent', color: filter === f ? '#fff' : 'var(--fg-dim)' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <QueryState
          loading={isLoading}
          error={error}
          onRetry={refetch}
          loadingTitle="Loading your schedule"
          loadingSubtitle="Bringing upcoming posts into view…"
        >
        {filtered.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-4">
            <p style={{ color: 'var(--fg-dim)', fontFamily: 'Inter, sans-serif' }}>No posts scheduled yet.</p>
            <Link to="/dashboard/studio" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to Studio to Schedule</Link>
          </div>
        ) : (
          <>
            {viewMode === 'list' && <div className="overflow-x-auto">
              <table className="scheduler-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Platform</th>
                    <th>Caption</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((post, i) => (
                    <tr key={post.id} style={{ animationDelay: `${i * 50}ms`, opacity: 1 }}>
                      <td>
                        <div className="flex items-center gap-4">
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: 'var(--border-dim)', flexShrink: 0 }}>
                            {resolveImageUrl(post) && (
                              <SecureImage
                                src={resolveImageUrl(post)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={`Scheduled ${post.platform} post thumbnail`}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[0.8rem]" style={{ color: 'var(--fg)', fontFamily: 'Inter, sans-serif' }}>
                              {new Date(post.scheduled_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-[0.62rem] mt-0.5" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--teal)' }}>{post.scheduled_time}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="flex items-center gap-2 text-[0.65rem] font-bold px-2.5 py-1.5 rounded-lg border w-fit uppercase tracking-wider" style={{ color: platformColors[post.platform]?.color || 'var(--fg)', background: platformColors[post.platform]?.bg || 'var(--border-dim)', borderColor: 'rgba(0,0,0,0.05)', fontFamily: 'Inter, sans-serif' }}>
                          <PlatformIcon platform={post.platform} />
                          {post.platform}
                        </span>
                      </td>
                      <td>
                        <span className="text-[0.72rem] line-clamp-2" style={{ color: 'var(--fg-dim)', fontFamily: 'Inter, sans-serif', maxWidth: 280, display: 'block', maxHeight: '2.4em', overflow: 'hidden' }}>
                          {post.caption || post.content?.caption_english || 'No caption'}
                        </span>
                      </td>
                      <td><StatusBadge status={post.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          <AppButton variant="subtle" onClick={() => handleView(post)}>View</AppButton>
                          <AppButton variant="ghost" onClick={() => handleEdit(post)}>Edit</AppButton>
                          {post.status !== 'CANCELLED' && post.status !== 'PUBLISHED' && (
                            <AppButton variant="danger" onClick={() => handleCancel(post.id)}>Cancel</AppButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
            {viewMode === 'grid' && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl border border-[var(--border-dim)] overflow-hidden">
                      <div className="p-4 flex items-center justify-between" style={{ background: platformColors[post.platform]?.bg || 'var(--border-dim)' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/80">
                            <PlatformIcon platform={post.platform} />
                          </div>
                          <div>
                            <p className="text-[0.68rem] font-bold uppercase" style={{ color: platformColors[post.platform]?.color || 'var(--fg)', fontFamily: 'Unbounded, sans-serif' }}>{post.platform}</p>
                            <p className="text-[0.58rem]" style={{ color: 'var(--fg-dim)', fontFamily: 'Space Mono, monospace' }}>{post.scheduled_time}</p>
                          </div>
                        </div>
                        <StatusBadge status={post.status} />
                      </div>
                      <div className="aspect-square bg-slate-100">
                        {resolveImageUrl(post) && (
                          <SecureImage
                            src={resolveImageUrl(post)}
                            alt={`Scheduled ${post.platform} post`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-[0.7rem] mb-2" style={{ color: 'var(--teal)', fontFamily: 'Space Mono, monospace' }}>
                          {new Date(post.scheduled_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[0.75rem] line-clamp-3" style={{ color: 'var(--fg-dim)', fontFamily: 'Inter, sans-serif' }}>
                          {post.caption || post.content?.caption_english || 'No caption'}
                        </p>
                      </div>
                      <div className="p-3 border-t border-[var(--border-dim)] flex gap-2">
                        <button onClick={() => handleView(post)} className="flex-1 py-2 rounded-lg text-[0.62rem] uppercase font-bold" style={{ background: 'rgba(0,122,100,0.08)', color: 'var(--teal)' }}>View</button>
                        <button onClick={() => handleEdit(post)} className="flex-1 py-2 rounded-lg text-[0.62rem] uppercase font-bold" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--fg-dim)' }}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-dim)', background: 'rgba(0,122,100,0.02)' }}>
          <span className="text-[0.58rem]" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dimmer)' }}>Showing {filtered.length} posts</span>
          <Link to="/dashboard/studio" className="text-[0.62rem] tracking-wider uppercase px-4 py-2 rounded-lg cursor-pointer border-none font-semibold transition-all duration-150 text-center" style={{ fontFamily: 'Space Mono, monospace', color: '#fff', background: 'var(--teal)', textDecoration: 'none' }}>+ New Post</Link>
        </div>
        </QueryState>
      </AppCard>

      {showViewModal && selectedPost && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowViewModal(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-lg text-black transition-all z-10 border-none cursor-pointer">×</button>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
              <div className="mb-6 text-center">
                <span className="text-[0.58rem] tracking-[0.2em] font-bold uppercase opacity-40 block mb-2 font-mono-custom">Social Media Preview</span>
                <h2 className="text-xl font-bold uppercase font-unbounded">{selectedPost.platform} Post</h2>
              </div>
              <div className="w-full max-w-[380px] scale-[0.9] sm:scale-100 origin-top">
                {selectedPost.platform.includes('INSTAGRAM') && (
                  <PreviewInstagramPost imageUrl={resolveImageUrl(selectedPost)} captionEn={selectedPost.caption || selectedPost.content?.caption_english} restaurantName={user?.restaurantName} avatarUrl={resolveLogoUrl(user?.logoUrl)} aspectRatio={selectedPost.content?.image_size === '1024x1792' ? '9 / 16' : selectedPost.content?.image_size === '1792x1024' ? '16 / 9' : '1 / 1'} />
                )}
                {selectedPost.platform.includes('FACEBOOK') && (
                  <PreviewFacebook imageUrl={resolveImageUrl(selectedPost)} captionEn={selectedPost.caption || selectedPost.content?.caption_english} restaurantName={user?.restaurantName} avatarUrl={resolveLogoUrl(user?.logoUrl)} />
                )}
                {selectedPost.platform.includes('TWITTER') && (
                  <PreviewTwitter imageUrl={resolveImageUrl(selectedPost)} captionEn={selectedPost.caption || selectedPost.content?.caption_english} restaurantName={user?.restaurantName} avatarUrl={resolveLogoUrl(user?.logoUrl)} />
                )}
                {selectedPost.platform.includes('WHATSAPP') && (
                  <PreviewWhatsApp imageUrl={resolveImageUrl(selectedPost)} captionEn={selectedPost.caption || selectedPost.content?.caption_english} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedPost && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(12,12,12,0.6)', backdropFilter: 'blur(12px)' }}>
          <div className="bg-white rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.3)] max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 p-8 sm:p-12 overflow-y-auto">
              <div className="mb-10">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-[var(--teal)] mb-2 block font-mono-custom">Management Studio</span>
                <h2 className="text-3xl font-black font-unbounded tracking-tighter uppercase leading-none">Edit Post</h2>
              </div>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[0.6rem] font-bold uppercase tracking-widest opacity-40 ml-1">Update Caption</label>
                  <textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="What's on the menu today?" className="w-full h-44 p-6 rounded-3xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[var(--teal)] transition-all outline-none text-[0.95rem] leading-relaxed text-gray-800 shadow-inner" style={{ fontFamily: 'Inter, sans-serif' }} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[0.6rem] font-bold uppercase tracking-widest opacity-40 ml-1">Schedule Date</label>
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full p-4 px-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[var(--teal)] transition-all outline-none text-sm font-medium" />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[0.6rem] font-bold uppercase tracking-widest opacity-40 ml-1">Publish Time</label>
                    <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full p-4 px-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[var(--teal)] transition-all outline-none text-sm font-medium" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <button onClick={handleUpdate} disabled={saving} className="flex-1 py-5 rounded-2xl bg-[var(--teal)] text-white font-bold text-[0.75rem] uppercase tracking-widest transition-all shadow-[0_12px_30px_rgba(0,122,100,0.3)] font-unbounded disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--teal) 0%, #00a486 100%)' }}>{saving ? 'Syncing...' : 'Save & Update'}</button>
                  <button onClick={() => setShowEditModal(false)} className="px-8 py-5 rounded-2xl bg-gray-100 text-gray-500 font-bold text-[0.75rem] uppercase tracking-widest transition-all font-unbounded">Cancel</button>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex w-[420px] bg-[#0f172a] relative flex-col items-center justify-center p-12 overflow-hidden shadow-inner">
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[var(--teal)] opacity-20 blur-[100px] rounded-full" />
              <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-600 opacity-10 blur-[100px] rounded-full" />
              <div className="relative z-10 w-full flex flex-col items-center">
                <div className="mb-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-3">
                    <PlatformIcon platform={selectedPost.platform} />
                    <span className="text-[0.55rem] font-bold text-white/60 uppercase tracking-widest">{selectedPost.platform}</span>
                  </div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-[0.2em] opacity-40">Live Preview</h3>
                </div>
                <div className="w-full scale-[1.05] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  {selectedPost.platform.includes('INSTAGRAM') && <PreviewInstagramPost captionEn={editCaption} restaurantName={user?.restaurantName} avatarUrl={resolveLogoUrl(user?.logoUrl)} imageUrl={resolveImageUrl(selectedPost)} aspectRatio={selectedPost.content?.image_size === '1024x1792' ? '9 / 16' : selectedPost.content?.image_size === '1792x1024' ? '16 / 9' : '1 / 1'} />}
                  {selectedPost.platform.includes('FACEBOOK') && <PreviewFacebook captionEn={editCaption} restaurantName={user?.restaurantName} avatarUrl={resolveLogoUrl(user?.logoUrl)} imageUrl={resolveImageUrl(selectedPost)} />}
                </div>
                <div className="mt-10 px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <p className="text-white/40 text-[0.65rem] font-medium italic">Changes update instantly in the preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}
