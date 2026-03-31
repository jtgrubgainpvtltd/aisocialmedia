import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { replies } from '../api/client'
import { ErrorBoundary } from 'react-error-boundary'
import { useAuth } from '../context/AuthContext'
import BRANDING from '../constants/branding'
import { PageErrorFallback } from '../components/GlobalErrorBoundary'

const ORANGE = BRANDING.colors.primary
const TEAL = BRANDING.colors.secondary
const NAVY = BRANDING.colors.navy

export default function DashboardShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Fetch pending replies count for the badge
  const { data: pendingReplies } = useQuery({
    queryKey: ['replies', { status: 'PENDING' }],
    queryFn: () => replies.getAll({ status: 'PENDING' }).then(r => r.data.data),
    refetchInterval: 30000 // poll every 30s for new comments
  })

  const pendingCount = pendingReplies?.length || 0

  const navItems = [
    { to: '/dashboard',              label: 'Dashboard',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, end: true },
    { to: '/dashboard/profile',      label: 'Restaurant Profile',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { to: '/dashboard/studio',       label: 'Content Studio',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { to: '/dashboard/city-feed',    label: 'City Feed',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { to: '/dashboard/scheduler',    label: 'Scheduler',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: '/dashboard/replies',      label: 'Reply Queue',         icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, badge: pendingCount > 0 ? pendingCount : null },
    { to: '/dashboard/analytics',    label: 'Analytics',           icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { to: '/dashboard/history',      label: 'History',             icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg> },
    { to: '/dashboard/integrations', label: 'Integrations',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const sidebarW = sidebarOpen ? 240 : 64

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F7F3EC', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarW, flexShrink: 0,
        background: NAVY, color: 'white',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden', position: 'relative', zIndex: 20,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarOpen ? '20px 20px 16px' : '20px 14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <img src={BRANDING.assets.logoMark} alt="GrubGain logo" style={{ width: 32, height: 32, flexShrink: 0 }} />
          {sidebarOpen && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.82rem', color: 'white', lineHeight: 1 }}>
                {BRANDING.appName.slice(0,4)}<span style={{ color: ORANGE }}>{BRANDING.appName.slice(4)}</span>
              </div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.36rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: 3 }}>
                {BRANDING.tagline}
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              marginLeft: sidebarOpen ? 'auto' : 0, background: 'transparent', border: 'none',
              cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 4,
              display: 'flex', alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {sidebarOpen ? <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></> : <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: sidebarOpen ? '10px 12px' : '10px',
                borderRadius: 8, marginBottom: 2,
                textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive ? `3px solid ${ORANGE}` : '3px solid transparent',
                transition: 'all 0.15s',
                position: 'relative',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('0.12')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('0.12')) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 500, flex: 1 }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: ORANGE, color: 'white',
                      fontSize: '0.52rem', fontWeight: 700, fontFamily: 'Unbounded, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{item.badge}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div
            onClick={() => setShowUserMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: sidebarOpen ? '10px 12px' : '10px',
              borderRadius: 8, cursor: 'pointer',
              background: showUserMenu ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'background 0.15s',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${TEAL} 0%, #00b89a 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.7rem', color: 'white',
            }}>
              {user?.avatar || 'S'}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.restaurantName}</p>
                <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
              </div>
            )}
          </div>
          {showUserMenu && sidebarOpen && (
            <div style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 8, marginTop: 4, overflow: 'hidden',
            }}>
              <button onClick={handleLogout} style={{
                width: '100%', padding: '10px 12px', background: 'transparent', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem',
                fontFamily: 'Inter, sans-serif', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        
        {/* Top Bar */}
        <header style={{
          height: 60, flexShrink: 0,
          background: 'rgba(247,243,236,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(12,12,12,0.08)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12,
          boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
        }}>
          {/* Restaurant name */}
          <div style={{
            padding: '7px 16px', borderRadius: 8,
            border: '1px solid rgba(12,12,12,0.12)',
            background: 'white', color: NAVY,
            fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {user?.restaurantName || 'My Restaurant'}
          </div>

          {/* City */}
          <div style={{
            padding: '7px 14px', borderRadius: 8,
            border: '1px solid rgba(12,12,12,0.12)',
            background: 'rgba(0,122,100,0.06)', color: TEAL,
            fontFamily: 'Space Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {user?.city || 'City'}
          </div>

          {/* Date range indicator */}
          <span style={{
            fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.08em',
            color: 'rgba(12,12,12,0.35)', padding: '7px 12px',
            border: '1px solid rgba(12,12,12,0.1)', borderRadius: 8,
            background: 'white',
          }}>
            {new Date(Date.now() - 20*24*60*60*1000).toLocaleDateString('en-IN',{month:'short',day:'numeric'})} — {new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}
          </span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Content Studio CTA */}
          <NavLink to="/dashboard/studio" style={{
            padding: '8px 16px', borderRadius: 8,
            background: TEAL, color: 'white', textDecoration: 'none',
            fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.58rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(0,122,100,0.25)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Content Studio
          </NavLink>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <ErrorBoundary FallbackComponent={PageErrorFallback}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
