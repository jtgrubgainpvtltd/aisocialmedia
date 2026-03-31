import { Link } from 'react-router-dom'
import BRANDING from '../constants/branding'

// GrubGain brand colors
const ORANGE = BRANDING.colors.primary
const TEAL = BRANDING.colors.secondary
const NAVY = BRANDING.colors.navy

const features = [
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>,
    title: 'AI Content Generation',
    desc: 'Auto-generate captions, offers, and festival posts in Hindi & English using advanced AI.'
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>,
    title: 'AI Image Creation',
    desc: 'Beautiful marketing creatives — food posters, festival banners, and story formats instantly.'
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>,
    title: 'Smart Scheduler',
    desc: 'Schedule posts across Instagram, Facebook, WhatsApp and more. Drag-and-drop calendar.'
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
    title: 'City-Wise Campaigns',
    desc: 'Trending events, rain alerts, IPL matches — get hyper-local contextual post ideas automatically.'
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-4" /><line x1="3" y1="20" x2="21" y2="20" /></svg>,
    title: 'Analytics Dashboard',
    desc: 'Track reach, engagement, coupon redemptions and ROI across all platforms in one place.'
  },
  {
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" /></svg>,
    title: 'Multi-Platform Publishing',
    desc: 'One click to publish on Instagram, Facebook, Google Business, WhatsApp and Twitter/X.'
  },
]

const stats = [
  { value: '2000+', label: 'Partner Restaurants' },
  { value: '15 Cities', label: 'Pan India Presence' },
  { value: '₹50L+', label: 'Savings Generated' },
  { value: '4.8★', label: 'Partner Rating' },
]

export default function Landing() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#F7F3EC', color: NAVY, overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(247,243,236,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(12,12,12,0.08)',
        padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={BRANDING.assets.logoMark} alt="GrubGain logo" style={{ width: 36, height: 36, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.95rem', color: NAVY, lineHeight: 1 }}>
              {BRANDING.appName.slice(0, 4)}<span style={{ color: ORANGE }}>{BRANDING.appName.slice(4)}</span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.42rem', letterSpacing: '0.12em', color: 'rgba(26,35,50,0.5)', textTransform: 'uppercase', marginTop: 2 }}>
              {BRANDING.tagline}
            </div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/login" style={{
            fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.08em',
            color: NAVY, textDecoration: 'none', textTransform: 'uppercase',
            padding: '8px 18px', borderRadius: 6,
            border: '1px solid rgba(26,35,50,0.2)',
            transition: 'all 0.15s',
          }}>Login</Link>
          <Link to="/register" style={{
            fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.06em',
            color: 'white', textDecoration: 'none', textTransform: 'uppercase',
            padding: '10px 20px', borderRadius: 6,
            background: TEAL,
            boxShadow: '0 4px 16px rgba(0,122,100,0.3)',
            transition: 'all 0.2s',
          }}>Partner With Us</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '88vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 48px', position: 'relative',
        background: `linear-gradient(135deg, #1a2332 0%, #243047 60%, #1a3a4a 100%)`,
        overflow: 'hidden',
      }}>
        {/* background pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        {/* orange glow */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,100,10,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,122,100,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <span style={{
              fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.2em',
              color: ORANGE, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: ORANGE,
                display: 'inline-block',
                boxShadow: `0 0 8px ${ORANGE}`,
                animation: 'pulse 1.8s infinite',
              }} />
              India's AI-Powered Restaurant Marketing Platform
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Unbounded, sans-serif', fontWeight: 900,
            fontSize: 'clamp(2.4rem, 6vw, 5.5rem)', lineHeight: 0.92,
            letterSpacing: '-0.04em', textTransform: 'uppercase',
            color: 'white', marginBottom: 28,
          }}>
            Partner With<br />
            <span style={{ color: ORANGE }}>GrubGain</span><br />
            <span style={{ WebkitTextStroke: '2px rgba(255,255,255,0.3)', color: 'transparent' }}>Grow Together</span>
          </h1>

          <p style={{
            fontSize: '1.05rem', fontWeight: 300, color: 'rgba(255,255,255,0.68)',
            maxWidth: 520, lineHeight: 1.8, marginBottom: 44,
          }}>
            Join India's leading food-tech platform. AI-powered marketing, city-wise campaigns,
            automatic scheduling, and real analytics — built exclusively for restaurants.
          </p>
          <div style={{ position: 'absolute', right: '-20px', top: -10, opacity: 0.95 }}>
            <img src={BRANDING.assets.mascot} alt="GrubGain mascot" style={{ height: 200, filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))' }} />
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.68rem',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: NAVY, textDecoration: 'none',
              padding: '16px 32px', borderRadius: 8,
              background: ORANGE,
              boxShadow: `0 8px 32px rgba(232,100,10,0.4)`,
              transition: 'all 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Become a Partner →
            </Link>
            <Link to="/login/restaurant" style={{
              fontFamily: 'Unbounded, sans-serif', fontWeight: 400, fontSize: '0.68rem',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'white', textDecoration: 'none',
              padding: '16px 32px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255,255,255,0.06)',
              transition: 'all 0.2s',
            }}>
              Restaurant Login
            </Link>
          </div>

          {/* stats row */}
          <div style={{
            display: 'flex', gap: 0, marginTop: 72,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 32,
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                flex: 1, paddingRight: 32,
                borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                marginRight: i < stats.length - 1 ? 32 : 0,
              }}>
                <div style={{
                  fontFamily: 'Unbounded, sans-serif', fontWeight: 900,
                  fontSize: '1.8rem', color: ORANGE, lineHeight: 1, marginBottom: 6,
                }}>{s.value}</div>
                <div style={{
                  fontFamily: 'Space Mono, monospace', fontSize: '0.58rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '100px 48px', background: '#F7F3EC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: TEAL, marginBottom: 16,
          }}>
            What You Get
          </div>
          <h2 style={{
            fontFamily: 'Unbounded, sans-serif', fontWeight: 900,
            fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', lineHeight: 0.92,
            letterSpacing: '-0.04em', textTransform: 'uppercase',
            color: NAVY, marginBottom: 56,
          }}>
            Everything Your<br />
            <span style={{ color: TEAL }}>Restaurant Needs</span>
          </h2>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 1, border: '1px solid rgba(12,12,12,0.1)',
            borderRadius: 16, overflow: 'hidden',
            background: 'rgba(12,12,12,0.07)',
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)',
                padding: '36px 32px',
                transition: 'background 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'white'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.75)'}
              >
                <div style={{
                  fontSize: '2rem', marginBottom: 16,
                  width: 52, height: 52, borderRadius: 12,
                  background: 'rgba(0,122,100,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
                  fontSize: '0.78rem', letterSpacing: '0.03em', textTransform: 'uppercase',
                  color: NAVY, marginBottom: 10,
                }}>{f.title}</h3>
                <p style={{
                  fontSize: '0.85rem', color: 'rgba(26,35,50,0.6)',
                  lineHeight: 1.7, fontWeight: 300,
                }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER BANNER ── */}
      <section style={{
        padding: '80px 48px',
        background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a4a 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: '-60px', top: '50%', transform: 'translateY(-50%)',
          fontFamily: 'Unbounded, sans-serif', fontWeight: 900,
          fontSize: 'clamp(8rem, 15vw, 18rem)', lineHeight: 1,
          color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.04)',
          pointerEvents: 'none', letterSpacing: '-0.04em',
        }}>GROW</div>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{
                fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: ORANGE, marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: ORANGE, display: 'inline-block' }} />
                For Restaurant Partners
              </div>
              <h2 style={{
                fontFamily: 'Unbounded, sans-serif', fontWeight: 900,
                fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', lineHeight: 0.92,
                letterSpacing: '-0.03em', textTransform: 'uppercase',
                color: 'white', marginBottom: 20,
              }}>
                Where Growth<br />
                <span style={{ color: ORANGE }}>Meets Savings</span>
              </h2>
              <p style={{
                fontSize: '0.95rem', color: 'rgba(255,255,255,0.58)',
                maxWidth: 480, lineHeight: 1.8, fontWeight: 300,
              }}>
                Get interest-free capital for your restaurant and deliver amazing discounts to customers.
                Join GrubGain today and unlock new opportunities, scale faster, and serve smarter.
              </p>
            </div>
            <Link to="/register" style={{
              fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.7rem',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: NAVY, textDecoration: 'none',
              padding: '18px 40px', borderRadius: 8,
              background: ORANGE, flexShrink: 0,
              boxShadow: `0 8px 32px rgba(232,100,10,0.4)`,
              display: 'inline-block',
            }}>
              Register as Partner
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '100px 48px', background: '#EDEAE2' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: TEAL, marginBottom: 16,
          }}>How It Works</div>
          <h2 style={{
            fontFamily: 'Unbounded, sans-serif', fontWeight: 900,
            fontSize: 'clamp(1.8rem, 4vw, 3.2rem)', lineHeight: 0.92,
            letterSpacing: '-0.04em', textTransform: 'uppercase',
            color: NAVY, marginBottom: 56,
          }}>Three Steps to<br /><span style={{ color: TEAL }}>Smarter Marketing</span></h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { num: '01', title: 'Set Up Your Profile', desc: 'Enter your restaurant details, brand tone, signature dishes, and target audience once.' },
              { num: '02', title: 'Generate AI Content', desc: 'One click generates bilingual captions, creative images, and platform-ready posts.' },
              { num: '03', title: 'Schedule & Publish', desc: 'Set it and forget it. Auto-post to all your social platforms at the optimal time.' },
            ].map(s => (
              <div key={s.num} style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16, padding: '36px 32px',
                border: '1px solid rgba(12,12,12,0.08)',
                boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  fontFamily: 'Unbounded, sans-serif', fontWeight: 900,
                  fontSize: '3.5rem', color: 'rgba(0,122,100,0.12)',
                  lineHeight: 1, marginBottom: 16,
                }}>{s.num}</div>
                <h3 style={{
                  fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
                  fontSize: '0.78rem', letterSpacing: '0.03em', textTransform: 'uppercase',
                  color: NAVY, marginBottom: 10,
                }}>{s.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(26,35,50,0.6)', lineHeight: 1.7, fontWeight: 300 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: NAVY,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 48px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 48, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src={BRANDING.assets.logoMark} alt="GrubGain logo" style={{ width: 32, height: 32 }} />
                <span style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '0.95rem', color: 'white' }}>
                  {BRANDING.appName.slice(0, 4)}<span style={{ color: ORANGE }}>{BRANDING.appName.slice(4)}</span>
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontWeight: 300, maxWidth: 240 }}>
                {BRANDING.tagline}<br />India's restaurant marketing & capital platform.
              </p>
            </div>
            {/* For You */}
            <div>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>For You</p>
              {['Restaurants Near Me', 'Terms & Conditions', 'Privacy Policy'].map(l => (
                <p key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: '0.82rem', color: ORANGE, textDecoration: 'none' }}>{l}</a>
                </p>
              ))}
            </div>
            {/* For Restaurants */}
            <div>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>For Restaurants</p>
              {['Terms & Conditions', 'List Your Restaurant', 'Partner Dashboard'].map(l => (
                <p key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{l}</a>
                </p>
              ))}
            </div>
            {/* Connect */}
            <div>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Contact</p>
              <p style={{ fontSize: '0.82rem', color: ORANGE, marginBottom: 6 }}>India — +91 730470 2620</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>US — +1 (650) 963 6103</p>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Connect with us:</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'f', url: 'https://www.facebook.com/profile.php?id=61577157061593' },
                  { id: 'in', url: 'https://www.linkedin.com/in/grub-gain-9225a736b/' },
                  { id: 'ig', url: 'https://www.instagram.com/grubgain/' },
                  { id: 'yt', url: 'https://www.youtube.com/@GrubGain' },
                  { id: 'tw', url: 'https://x.com/GrubGain' }
                ].map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)',
                      fontFamily: 'Space Mono, monospace', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
                      {s.id}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
              © 2026 GrubGain. All rights reserved.
            </span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.56rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
              AI Digital Marketing Tool
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
