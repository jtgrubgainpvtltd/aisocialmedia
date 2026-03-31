import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BRANDING from '../constants/branding'

const ORANGE = '#E8640A'
const TEAL = '#007A64'
const NAVY = '#1a2332'

export default function RestaurantLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    setError('')
    
    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    border: '1px solid rgba(12,12,12,0.15)',
    borderRadius: 8, fontSize: '0.88rem',
    fontFamily: 'Inter, sans-serif',
    color: NAVY, background: '#faf8f4',
    outline: 'none', transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block', marginBottom: 6,
    fontSize: '0.72rem', fontWeight: 500, color: NAVY,
    fontFamily: 'Inter, sans-serif',
  }

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
          <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.88rem', color: NAVY }}>
            Grub<span style={{ color: ORANGE }}>Gain</span>
          </div>
        </Link>
        <Link to="/login" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.08em', color: TEAL, textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Back
        </Link>
      </nav>

      {/* Form card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid rgba(12,12,12,0.1)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.06)',
          padding: '48px 44px', width: '100%', maxWidth: 460,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src={BRANDING.assets.logoMark} alt="GrubGain logo" style={{ width: 64, height: 64, margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.1rem', color: NAVY, lineHeight: 1, marginBottom: 4 }}>
              Grub<span style={{ color: ORANGE }}>Gain</span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.44rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,35,50,0.4)', marginBottom: 20 }}>
              Feeding Growth. Serving Savings.
            </div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.3rem', color: NAVY, marginBottom: 4 }}>
              Restaurant Login
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'rgba(26,35,50,0.5)' }}>
              Access your AI marketing dashboard
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '12px 16px', marginBottom: 20, borderRadius: 8,
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
              color: '#dc2626', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="admin@yourrestaurant.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = TEAL}
                onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'}
                required
              />
            </div>
            <div style={{ marginBottom: 28, position: 'relative' }}>
              <label style={labelStyle}>Password</label>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = TEAL}
                onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: 34,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'rgba(26,35,50,0.4)', padding: 0,
                }}
              >
                {showPwd ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 8,
                background: loading ? 'rgba(0,122,100,0.6)' : TEAL,
                color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.65rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,122,100,0.3)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                  </svg>
                  Signing In...
                </>
              ) : 'Sign In to Dashboard'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(26,35,50,0.5)' }}>
              New to GrubGain?{' '}
              <Link to="/register" style={{ color: TEAL, fontWeight: 500, textDecoration: 'none' }}>
                Register as Partner
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
