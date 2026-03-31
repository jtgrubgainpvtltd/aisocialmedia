import { Link } from 'react-router-dom'
import BRANDING from '../constants/branding'

const ORANGE = '#E8640A'
const TEAL = '#007A64'
const NAVY = '#1a2332'

export default function LoginChoice() {
  return (
    <div style={{
      minHeight: '100vh', background: '#F7F3EC',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Nav */}
      <nav style={{
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(247,243,236,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(12,12,12,0.08)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={BRANDING.assets.logoMark} alt="logo" style={{ width: 32, height: 32 }} />
          <div>
            <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.88rem', color: NAVY, lineHeight: 1 }}>
              Grub<span style={{ color: ORANGE }}>Gain</span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.4rem', letterSpacing: '0.12em', color: 'rgba(26,35,50,0.4)', textTransform: 'uppercase', marginTop: 2 }}>
              Feeding Growth. Serving Savings.
            </div>
          </div>
        </Link>
        <Link to="/register" style={{
          fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.06em',
          color: 'white', textDecoration: 'none', textTransform: 'uppercase',
          padding: '9px 18px', borderRadius: 6, background: TEAL,
        }}>Partner With Us</Link>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src={BRANDING.assets.logoMark} alt="GrubGain logo" style={{ width: 80, height: 80, margin: '0 auto 14px' }} />
          <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.4rem', color: NAVY, lineHeight: 1 }}>
            Grub<span style={{ color: ORANGE }}>Gain</span>
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,35,50,0.4)', marginTop: 4 }}>
            Feeding Growth. Serving Savings.
          </div>
        </div>

        <h1 style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.5rem',
          color: NAVY, textAlign: 'center', marginBottom: 8,
        }}>Welcome to GrubGain</h1>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: 'rgba(26,35,50,0.55)',
          textAlign: 'center', marginBottom: 40,
        }}>Please choose an option to continue.</p>

        {/* Choice cards */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Customer card */}
          <div style={{
            width: 180, padding: '36px 24px',
            border: '2px solid rgba(12,12,12,0.1)', borderRadius: 12,
            background: 'white', textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,122,100,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(12,12,12,0.1)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.04)' }}
          >
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: NAVY }}>Log In as<br/>Customer</p>
          </div>

          {/* Restaurant card */}
          <Link to="/login/restaurant" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 180, padding: '36px 24px',
              border: '2px solid rgba(12,12,12,0.1)', borderRadius: 12,
              background: 'white', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,122,100,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(12,12,12,0.1)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.04)' }}
            >
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.88rem', color: NAVY }}>Log In as<br/>Restaurant</p>
            </div>
          </Link>
        </div>

        <p style={{
          marginTop: 36, fontFamily: 'Space Mono, monospace', fontSize: '0.6rem',
          letterSpacing: '0.08em', color: 'rgba(26,35,50,0.35)',
        }}>
          New restaurant? <Link to="/register" style={{ color: TEAL, textDecoration: 'none' }}>Register as Partner</Link>
        </p>
      </div>

      {/* Footer bar */}
      <footer style={{
        background: NAVY, padding: '24px 48px',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        <div>
          <p style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>GrubGain</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['About Us', 'Contact Us'].map(l => <a key={l} href="#" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', letterSpacing: '0.06em' }}>{l}</a>)}
          </div>
        </div>
        <div>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>For You</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Restaurants Near Me', 'Terms & Conditions', 'Privacy Policy'].map(l => <a key={l} href="#" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: ORANGE, textDecoration: 'none' }}>{l}</a>)}
          </div>
        </div>
        <div>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>For Restaurants</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Terms & Conditions', 'List your restaurant!'].map(l => <a key={l} href="#" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>{l}</a>)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: ORANGE, marginBottom: 4 }}>India — +91 730470 2620</p>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: 'rgba(255,255,255,0.35)' }}>US — +1 (650) 963 6103</p>
        </div>
      </footer>
    </div>
  )
}
