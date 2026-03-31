import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { locations } from '../api/client'
import BRANDING from '../constants/branding'

const ORANGE = '#E8640A'
const TEAL = '#007A64'
const NAVY = '#1a2332'

const inputStyle = {
  width: '100%', padding: '11px 14px',
  border: '1px solid rgba(12,12,12,0.15)',
  borderRadius: 8, fontSize: '0.85rem',
  fontFamily: 'Inter, sans-serif',
  color: NAVY, background: '#faf8f4',
  outline: 'none', transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}
const labelStyle = {
  display: 'block', marginBottom: 5,
  fontSize: '0.72rem', fontWeight: 500, color: NAVY,
  fontFamily: 'Inter, sans-serif',
}
const FormField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

export default function PartnerRegister() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    restaurantName: '', executiveName: '', contact: '', email: '',
    password: '', confirmPassword: '',
    state: '', city: '', address: '',
    cuisineType: '', targetAudience: '',
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => {
    const loadStates = async () => {
      try {
        const { data } = await locations.getStates()
        if (data?.success) {
          setStates(data.data || [])
        }
      } catch (err) {
        console.error('Failed to load states', err)
      }
    }
    loadStates()
  }, [])

  useEffect(() => {
    const loadCities = async () => {
      if (!form.state) {
        setCities([])
        return
      }
      try {
        const { data } = await locations.getCitiesByState(form.state)
        if (data?.success) {
          setCities(data.data?.cities || [])
        } else {
          setCities([])
        }
      } catch (err) {
        console.error('Failed to load cities', err)
        setCities([])
      }
    }
    loadCities()
  }, [form.state])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step < 2) { setStep(2); return }

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and number')
      return
    }
    
    setLoading(true)
    setError('')
    
    const result = await register({
      email: form.email,
      password: form.password,
      restaurantName: form.restaurantName,
      city: form.city,
      area: form.address,
      cuisineType: form.cuisineType,
      targetAudience: form.targetAudience,
    })

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F3EC', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(247,243,236,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(12,12,12,0.08)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={BRANDING.assets.logoMark} alt="logo" style={{ width: 32, height: 32 }} />
          <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.88rem', color: NAVY }}>
            Grub<span style={{ color: ORANGE }}>Gain</span>
          </div>
        </Link>
        <Link to="/login" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.08em', color: TEAL, textDecoration: 'none', textTransform: 'uppercase' }}>
          Login
        </Link>
      </nav>

      <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px 60px' }}>
        {/* Form Card */}
        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid rgba(12,12,12,0.1)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '36px 44px 0', textAlign: 'center' }}>
            <img src={BRANDING.assets.logoMark} alt="GrubGain logo" style={{ width: 64, height: 64, margin: '0 auto 12px' }} />
            <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1rem', color: NAVY, lineHeight: 1, marginBottom: 4 }}>
              Grub<span style={{ color: ORANGE }}>Gain</span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.42rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(26,35,50,0.4)', marginBottom: 16 }}>
              Feeding Growth. Serving Savings.
            </div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.3rem', color: NAVY, marginBottom: 6 }}>
              Create your GrubGain Account
            </h1>
            {/* Progress */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, marginBottom: 4 }}>
              {[1, 2].map(n => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: step >= n ? TEAL : 'rgba(12,12,12,0.08)',
                    color: step >= n ? 'white' : 'rgba(12,12,12,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Unbounded, sans-serif',
                    transition: 'all 0.3s',
                  }}>{n}</div>
                  {n < 2 && <div style={{ width: 40, height: 2, background: step > 1 ? TEAL : 'rgba(12,12,12,0.08)', transition: 'all 0.3s' }} />}
                </div>
              ))}
            </div>
            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(26,35,50,0.4)', marginBottom: 4 }}>
              Step {step} of 2 — {step === 1 ? 'Restaurant & Contact Details' : 'Account Setup & Password'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              margin: '16px 44px 0', padding: '12px 16px', borderRadius: 8,
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
              color: '#dc2626', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ padding: '28px 44px' }}>
              {step === 1 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <FormField label="Restaurant Name *">
                    <input value={form.restaurantName} onChange={e => set('restaurantName', e.target.value)} placeholder="Restaurant Name" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} required />
                  </FormField>
                  <FormField label="Executive Name">
                    <input value={form.executiveName} onChange={e => set('executiveName', e.target.value)} placeholder="Executive Name" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                  <FormField label="Contact Number">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ ...inputStyle, width: 64, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', background: '#f0ede8' }}>
                        <span style={{ fontSize: '0.85rem' }}>🇮🇳</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(26,35,50,0.6)' }}>+91</span>
                      </div>
                      <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Mobile Number" style={{ ...inputStyle, flex: 1 }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                    </div>
                  </FormField>
                  <FormField label="Email Address *">
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email Address" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} required />
                  </FormField>
                  <FormField label="State">
                    <div style={{ position: 'relative' }}>
                      <select value={form.state} onChange={e => { set('state', e.target.value); set('city', '') }} style={{ ...inputStyle, appearance: 'none', paddingRight: 36 }}>
                        <option value="">Select State</option>
                         {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </FormField>
                  <FormField label="City *">
                    <div style={{ position: 'relative' }}>
                      <select value={form.city} onChange={e => set('city', e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 36 }}>
                        <option value="">Select City</option>
                         {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </FormField>
                  <FormField label="Cuisine Type">
                    <input value={form.cuisineType} onChange={e => set('cuisineType', e.target.value)} placeholder="e.g. North Indian, Chinese" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                  <FormField label="Target Audience">
                    <input value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)} placeholder="e.g. Families, Students" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField label="Restaurant Address">
                      <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Restaurant Address" rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                    </FormField>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <FormField label="Password *">
                    <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 chars, uppercase, lowercase, number" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} required />
                  </FormField>
                  <FormField label="Confirm Password *">
                    <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} required />
                  </FormField>
                  {/* Summary */}
                  <div style={{ gridColumn: '1 / -1', padding: '16px 20px', borderRadius: 8, background: 'rgba(0,122,100,0.06)', border: '1px solid rgba(0,122,100,0.15)' }}>
                    <p style={{ fontSize: '0.78rem', color: TEAL, fontWeight: 600, marginBottom: 8 }}>📋 Registration Summary</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.75rem', color: 'rgba(26,35,50,0.7)' }}>
                      <span><strong>Restaurant:</strong> {form.restaurantName || '—'}</span>
                      <span><strong>Email:</strong> {form.email || '—'}</span>
                      <span><strong>City:</strong> {form.city || '—'}</span>
                      <span><strong>Cuisine:</strong> {form.cuisineType || '—'}</span>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', padding: '12px 16px', borderRadius: 8, background: 'rgba(0,122,100,0.06)', border: '1px solid rgba(0,122,100,0.15)' }}>
                    <p style={{ fontSize: '0.75rem', color: TEAL, lineHeight: 1.6 }}>
                      🔒 Your password is encrypted and your details are secured. By registering, you agree to GrubGain's Terms of Service.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div style={{
              padding: '20px 44px 36px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid rgba(12,12,12,0.06)',
            }}>
              {step === 2 ? (
                <button type="button" onClick={() => { setStep(1); setError('') }} style={{
                  padding: '11px 24px', borderRadius: 8, border: '1px solid rgba(12,12,12,0.15)',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: NAVY,
                }}>← Back</button>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'rgba(26,35,50,0.45)' }}>
                  Already registered? <Link to="/login/restaurant" style={{ color: TEAL, textDecoration: 'none', fontWeight: 500 }}>Login</Link>
                </p>
              )}
              <button type="submit" disabled={loading} style={{
                padding: '12px 32px', borderRadius: 8, border: 'none',
                background: loading ? 'rgba(0,122,100,0.6)' : TEAL, color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.62rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(0,122,100,0.25)',
              }}>
                {loading ? 'Creating Account...' : step === 1 ? 'Next: Set Password →' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
