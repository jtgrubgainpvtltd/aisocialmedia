import { useState, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { replies } from '../api/client'
import { ErrorBoundary } from 'react-error-boundary'
import { useAuth } from '../context/AuthContext'
import BRANDING from '../constants/branding'
import { PageErrorFallback } from '../components/GlobalErrorBoundary'
import { resolveMediaUrl } from '../utils/mediaUrl'
import { useIsSmallScreen } from '../utils/useIsSmallScreen'
import SecureImage from '../components/ui/SecureImage'

const ORANGE = BRANDING.colors.primary
const TEAL = BRANDING.colors.secondary
const NAVY = BRANDING.colors.navy


export default function DashboardShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [isPinned, setIsPinned] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const hoverTimeout = useRef(null)
  
  const isOpen = isPinned || isHovered
  const isMobile = useIsSmallScreen()

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

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false)
    }, 150)
  }

  const sidebarW = isOpen ? 240 : 64

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F7F3EC', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .pin-btn {
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1) !important;
        }
        .pin-btn.unpinned:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .pin-btn.pinned:hover {
          background: rgba(0,184,154,0.25) !important;
        }
        .pin-btn:hover {
          transform: scale(1.05);
        }
        .pin-btn:active {
          transform: scale(0.92);
        }
        @media (max-width: 768px) {
          .topbar-date { display: none !important; }
          .topbar-city { display: none !important; }
        }
      `}</style>
      
        {/* ── SIDEBAR ── */}
      <aside 
        className="dashboard-sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: sidebarW, flexShrink: 0,
          background: NAVY, color: 'white',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden', zIndex: 100,
          boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none',
          position: isMobile ? 'absolute' : 'relative',
          height: '100vh', left: 0, top: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: isOpen ? '20px 20px 16px' : '20px 14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          transition: 'padding 0.3s'
        }}>
          <img src={BRANDING.assets.logoMark} alt="GrubGain logo" style={{ width: 32, height: 32, flexShrink: 0 }} />
          
          <div style={{ 
            overflow: 'hidden', whiteSpace: 'nowrap',
            opacity: isOpen ? 1 : 0,
            width: isOpen ? 110 : 0,
            transition: 'opacity 0.2s, width 0.3s',
            pointerEvents: isOpen ? 'auto' : 'none'
          }}>
            <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.82rem', color: 'white', lineHeight: 1 }}>
              {BRANDING.appName.slice(0,4)}<span style={{ color: ORANGE }}>{BRANDING.appName.slice(4)}</span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.36rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: 3 }}>
              {BRANDING.tagline}
            </div>
          </div>
          
          <button
            className={`pin-btn ${isPinned ? 'pinned' : 'unpinned'}`}
            onClick={() => {
              setIsPinned(p => {
                if (p) setIsHovered(false); // Force collapse immediately if unpinning
                return !p;
              })
            }}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            style={{
              position: 'absolute', right: 16, top: 16,
              width: 28, height: 28,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: isPinned ? TEAL : 'rgba(255,255,255,0.4)',
              background: isPinned ? 'rgba(0,184,154,0.12)' : 'transparent',
              border: isPinned ? '1px solid rgba(0,184,154,0.25)' : '1px solid transparent',
              boxShadow: isPinned ? '0 0 12px rgba(0,184,154,0.1)' : 'none',
              flexShrink: 0,
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? 'auto' : 'none',
              zIndex: 30,
            }}
          >
            <svg 
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isPinned ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            >
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
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
              title={!isOpen ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: isOpen ? '10px 12px' : '10px',
                borderRadius: 8, marginBottom: 2,
                textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive ? `3px solid ${ORANGE}` : '3px solid transparent',
                transition: 'background 0.15s, padding 0.3s, justify-content 0.3s',
                position: 'relative',
                justifyContent: isOpen ? 'flex-start' : 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('0.12')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('0.12')) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0, transition: 'transform 0.3s', transform: isOpen ? 'translateX(0)' : 'translateX(0)' }}>{item.icon}</span>
              <div style={{ 
                display: 'flex', alignItems: 'center', flex: 1, 
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 140 : 0,
                transition: 'opacity 0.2s, width 0.3s',
                overflow: 'hidden'
              }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: 500, flex: 1 }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: ORANGE, color: 'white',
                    fontSize: '0.52rem', fontWeight: 700, fontFamily: 'Unbounded, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>{item.badge}</span>
                )}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div
            onClick={() => setShowUserMenu(v => !v)}
            title={!isOpen ? "User Profile" : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: isOpen ? '10px 12px' : '10px',
              borderRadius: 8, cursor: 'pointer',
              background: showUserMenu ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'background 0.15s, padding 0.3s, justify-content 0.3s',
              justifyContent: isOpen ? 'flex-start' : 'center',
              overflow: 'hidden'
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: user?.logoUrl ? 'white' : `linear-gradient(135deg, ${TEAL} 0%, #00b89a 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.7rem', color: 'white',
              overflow: 'hidden', border: user?.logoUrl ? '1px solid rgba(255,255,255,0.2)' : 'none'
            }}>
              {user?.logoUrl ? (
                <SecureImage 
                  src={user.logoUrl} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  alt="PFP" 
                />
              ) : (
                user?.avatar || (user?.restaurantName?.[0] || 'S')
              )}
            </div>
            
            <div style={{ 
              flex: 1, overflow: 'hidden', 
              opacity: isOpen ? 1 : 0, 
              width: isOpen ? 120 : 0,
              transition: 'opacity 0.2s, width 0.3s'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.restaurantName}</p>
              <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
          </div>
          {showUserMenu && isOpen && (
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, marginLeft: isMobile ? 64 : 0 }}>
        
        {/* Top Bar */}
        <header style={{
          minHeight: 60, height: 'auto', flexShrink: 0,
          background: 'rgba(247,243,236,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(12,12,12,0.08)',
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          padding: isMobile ? '8px 12px' : '0 24px', gap: isMobile ? 8 : 12,
          boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
        }}>
          {/* Restaurant name */}
          <div style={{
            padding: isMobile ? '6px 12px' : '7px 16px', borderRadius: 8,
            border: '1px solid rgba(12,12,12,0.12)',
            background: 'white', color: NAVY,
            fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span style={{ maxWidth: isMobile ? 120 : 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.restaurantName || 'My Restaurant'}
            </span>
          </div>

          {/* City */}
          {!isMobile && (
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
          )}

          {/* Date range indicator */}
          <span className="topbar-date" style={{
            fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.08em',
            color: 'rgba(12,12,12,0.35)', padding: '7px 12px',
            border: '1px solid rgba(12,12,12,0.1)', borderRadius: 8,
            background: 'white',
          }}>
            {new Date(Date.now() - 20*24*60*60*1000).toLocaleDateString('en-IN',{month:'short',day:'numeric'})} — {new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}
          </span>

          {/* Spacer */}
          <div style={{ flex: 1, minWidth: isMobile ? 0 : 'auto' }} />

          {/* Content Studio CTA */}
          <NavLink to="/dashboard/studio" style={{
            padding: isMobile ? '8px 10px' : '8px 16px', borderRadius: 8,
            background: TEAL, color: 'white', textDecoration: 'none',
            fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.58rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(0,122,100,0.25)',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            {isMobile ? 'Studio' : 'Content Studio'}
          </NavLink>
        </header>

        {/* Scrollable content */}
        <main className="dashboard-main-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <ErrorBoundary FallbackComponent={PageErrorFallback}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
