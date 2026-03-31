import { useState, useEffect } from 'react'
import { restaurant } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const TEAL = '#007A64'
const NAVY = '#1a2332'

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1px solid rgba(12,12,12,0.15)',
  borderRadius: 8, fontSize: '0.82rem',
  fontFamily: 'Inter, sans-serif',
  color: NAVY, background: 'white',
  outline: 'none', transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}
const labelStyle = {
  display: 'block', marginBottom: 6,
  fontSize: '0.7rem', fontWeight: 600, color: NAVY,
  fontFamily: 'Inter, sans-serif',
}

const FormField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

export default function RestaurantProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '', city: '', area: '',
    cuisine: '', audience: '',
    tone: '', language: '',
    about: '',
    signatureDishes: '',
    offers: '',
    hashtags: '',
    phoneNumber: '',
    contactEmail: '',
    website: '',
    googleMapsUrl: '',
    fullAddress: '',
    ownerName: '',
    priceRange: '',
    avgOrderValue: '',
    gstNumber: '',
    fssaiLicense: '',
    instagramHandle: '',
    facebookPage: '',
    twitterHandle: '',
    tagline: '',
    brandColor: '#E8640A',
    brandStory: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Load restaurant profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data } = await restaurant.get()
      if (data.success && data.data) {
        const r = data.data
        setForm({
          name: r.restaurant_name || r.name || '',
          city: r.city || '',
          area: r.area || '',
          cuisine: r.cuisine_type || '',
          audience: r.target_audience || '',
          tone: r.brand_tone || '',
          language: r.language_preference || 'BILINGUAL',
          about: r.about_description || '',
          signatureDishes: r.signature_dishes || '',
          offers: r.standard_offers || '',
          hashtags: r.hashtags || '',
          phoneNumber: r.phone_number || '',
          contactEmail: r.contact_email || '',
          website: r.website || '',
          googleMapsUrl: r.google_maps_url || '',
          fullAddress: r.full_address || '',
          ownerName: r.owner_name || '',
          priceRange: r.price_range || '',
          avgOrderValue: r.avg_order_value || '',
          gstNumber: r.gst_number || '',
          fssaiLicense: r.fssai_license || '',
          instagramHandle: r.instagram_handle || '',
          facebookPage: r.facebook_page || '',
          twitterHandle: r.twitter_handle || '',
          tagline: r.tagline || '',
          brandColor: r.brand_color || '#E8640A',
          brandStory: r.brand_story || '',
        })
      }
    } catch (err) {
      // If 404, use defaults from user context
      if (user) {
        setForm(f => ({
          ...f,
          name: user.restaurantName || '',
          city: user.city || '',
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      await restaurant.update({
        name: form.name,
        city: form.city,
        area: form.area,
        cuisine_type: form.cuisine,
        target_audience: form.audience,
        brand_tone: form.tone,
        language_preference: form.language,
        about_description: form.about,
        signature_dishes: form.signatureDishes,
        standard_offers: form.offers,
        hashtags: form.hashtags,
        phone_number: form.phoneNumber,
        contact_email: form.contactEmail,
        website: form.website,
        google_maps_url: form.googleMapsUrl,
        full_address: form.fullAddress,
        owner_name: form.ownerName,
        price_range: form.priceRange,
        avg_order_value: form.avgOrderValue ? Number(form.avgOrderValue) : null,
        gst_number: form.gstNumber,
        fssai_license: form.fssaiLicense,
        instagram_handle: form.instagramHandle,
        facebook_page: form.facebookPage,
        twitter_handle: form.twitterHandle,
        tagline: form.tagline,
        brand_color: form.brandColor,
        brand_story: form.brandStory,
      })
      setMessage({ type: 'success', text: '✅ Profile saved successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('asset_type', 'LOGO')

    try {
      await restaurant.uploadAsset(formData)
      setMessage({ type: 'success', text: '✅ Logo uploaded successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload logo' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('asset_type', 'REFERENCE_PHOTO')

    try {
      await restaurant.uploadAsset(formData)
      setMessage({ type: 'success', text: '✅ Photo uploaded successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload photo' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const [activeTab, setActiveTab] = useState('basic')

  if (loading) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', color: 'rgba(12,12,12,0.4)', animation: 'pulse 1.5s infinite' }}>
          Loading your profile...
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Basic Details' },
    { id: 'contact', label: 'Contact & Location' },
    { id: 'business', label: 'Business Info' },
    { id: 'branding', label: 'AI Branding & Rule Engine' },
    { id: 'assets', label: 'Brand Assets' },
  ]

  return (
    <div style={{ padding: '36px 42px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.04em', color: NAVY, lineHeight: 1 }}>Restaurant Profile</h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', color: 'rgba(12,12,12,0.5)', marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>
            The more detail you provide about your brand, the better our AI engine becomes at generating hyper-personalized, engaging marketing content tailored exclusively for your audience.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '12px 32px', borderRadius: 8, border: 'none', background: saving ? 'rgba(0,122,100,0.6)' : TEAL,
          color: 'white', fontFamily: 'Unbounded, sans-serif', fontWeight: 700, fontSize: '0.62rem',
          letterSpacing: '0.08em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: saving ? 'none' : '0 4px 16px rgba(0,122,100,0.25)', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          {saving ? 'Saving...' : 'Save Profile'}
          {!saving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </button>
      </div>

      {/* Status message */}
      {message.text && (
        <div style={{
          padding: '14px 20px', marginBottom: 24, borderRadius: 10,
          background: message.type === 'success' ? 'rgba(0,122,100,0.06)' : 'rgba(220,38,38,0.06)',
          border: `1px solid ${message.type === 'success' ? 'rgba(0,122,100,0.2)' : 'rgba(220,38,38,0.2)'}`,
          color: message.type === 'success' ? TEAL : '#dc2626',
          fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {message.text}
        </div>
      )}

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        
        {/* Sidebar Tabs */}
        <div style={{
          width: 240, flexShrink: 0, 
          display: 'flex', flexDirection: 'column', gap: 6,
          position: 'sticky', top: 90,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 8, textAlign: 'left',
                border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? TEAL : 'rgba(12,12,12,0.5)',
                fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 600 : 500,
                boxShadow: activeTab === tab.id ? '0 2px 12px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = NAVY }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(12,12,12,0.5)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(12,12,12,0.08)', borderRadius: 16,
          padding: '36px 42px', boxShadow: '0 2px 24px rgba(0,0,0,0.02)',
          minHeight: 500,
        }}>
          
          {/* BASIC DETAILS */}
          {activeTab === 'basic' && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.2rem', color: NAVY, marginBottom: 28 }}>Basic Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <FormField label="Restaurant Name">
                  <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} placeholder="e.g. The Rustic Oven" />
                </FormField>
                <FormField label="Owner / Manager Name">
                  <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="About Description">
                    <textarea value={form.about} onChange={e => set('about', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Tell us a bit about your restaurant's history, vibe, and specialties..." onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT & LOCATION */}
          {activeTab === 'contact' && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.2rem', color: NAVY, marginBottom: 28 }}>Contact & Location</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <FormField label="Phone Number">
                  <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <FormField label="Contact Email">
                  <input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <FormField label="City">
                  <input value={form.city} onChange={e => set('city', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <FormField label="Area / Locality">
                  <input value={form.area} onChange={e => set('area', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Full Address">
                    <textarea value={form.fullAddress} onChange={e => set('fullAddress', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Google Maps Link">
                    <input value={form.googleMapsUrl} onChange={e => set('googleMapsUrl', e.target.value)} style={inputStyle} placeholder="https://maps.google.com/..." onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS INFO */}
          {activeTab === 'business' && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.2rem', color: NAVY, marginBottom: 28 }}>Business Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                <FormField label="GST Number">
                  <input value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <FormField label="FSSAI License">
                  <input value={form.fssaiLicense} onChange={e => set('fssaiLicense', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <FormField label="Average Order Value (₹)">
                  <input value={form.avgOrderValue} onChange={e => set('avgOrderValue', e.target.value)} placeholder="e.g. 450" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <FormField label="Pricing Tier">
                  <div style={{ position: 'relative' }}>
                    <select value={form.priceRange} onChange={e => set('priceRange', e.target.value)} style={{ ...inputStyle, appearance: 'none' }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'}>
                      <option value="">Select Tier</option>
                      {['Budget Friendly (₹)', 'Moderate (₹₹)', 'Premium (₹₹₹)', 'Luxury (₹₹₹₹)'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </FormField>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Standard Offers & Discounts">
                    <input value={form.offers} onChange={e => set('offers', e.target.value)} placeholder="e.g. 15% off on Takeaway, Happy Hours 4-7 PM" style={{ ...inputStyle, background: 'rgba(0,122,100,0.03)', borderColor: 'rgba(0,122,100,0.2)' }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(0,122,100,0.2)'} />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* BRANDING */}
          {activeTab === 'branding' && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(232,100,10,0.06)', border: '1px solid rgba(232,100,10,0.2)', marginBottom: 28, display: 'flex', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#E8640A', lineHeight: 1.5, margin: 0 }}>This section is heavily relied upon by the AI engine to maintain your brand voice and visual style when auto-generating captions and images.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <FormField label="Cuisine Speciality">
                  <input value={form.cuisine} onChange={e => set('cuisine', e.target.value)} placeholder="e.g. Authentic Pan-Asian" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                </FormField>
                <FormField label="Target Audience">
                  <div style={{ position: 'relative' }}>
                    <select value={form.audience} onChange={e => set('audience', e.target.value)} style={{ ...inputStyle, appearance: 'none' }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'}>
                      <option value="">Select Audience</option>
                      {['Families', 'College Students', 'Corporate/Professionals', 'Couples', 'Gen Z / Millennials', 'Everyone'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </FormField>
                <FormField label="Brand Tone of Voice">
                  <div style={{ position: 'relative' }}>
                    <select value={form.tone} onChange={e => set('tone', e.target.value)} style={{ ...inputStyle, appearance: 'none' }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'}>
                      <option value="">Select Tone</option>
                      {['Fun & Youthful', 'Premium & Elegant', 'Family Friendly', 'Street Style', 'Traditional & Authentic', 'Witty & Sarcastic'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </FormField>
                <FormField label="Content Language Preference">
                  <div style={{ position: 'relative' }}>
                    <select value={form.language} onChange={e => set('language', e.target.value)} style={{ ...inputStyle, appearance: 'none' }} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'}>
                      <option value="BILINGUAL">Bilingual (English + Hindi)</option>
                      <option value="ENGLISH">English Only</option>
                      <option value="HINDI">Hindi Only</option>
                    </select>
                    <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </FormField>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Signature Dishes (Comma Separated)">
                    <input value={form.signatureDishes} onChange={e => set('signatureDishes', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Always Include Hashtags">
                    <input value={form.hashtags} onChange={e => set('hashtags', e.target.value)} placeholder="#Foodie, #MumbaiEats, #Margaritas" style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormField label="Brand Tagline or Slogan">
                    <input value={form.tagline} onChange={e => set('tagline', e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = TEAL} onBlur={e => e.target.style.borderColor = 'rgba(12,12,12,0.15)'} />
                  </FormField>
                </div>
                <FormField label="Primary Brand Color">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="color" value={form.brandColor} onChange={e => set('brandColor', e.target.value)} style={{ width: 42, height: 42, padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }} />
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.8rem', color: NAVY }}>{form.brandColor.toUpperCase()}</span>
                  </div>
                </FormField>
              </div>
            </div>
          )}

          {/* ASSETS */}
          {activeTab === 'assets' && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1.2rem', color: NAVY, marginBottom: 28 }}>Brand Assets</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: 32 }}>
                <FormField label="Brand Logo (High Res)">
                  <label style={{ 
                    border: '1px dashed rgba(12,12,12,0.25)', borderRadius: 12, padding: 32, 
                    textAlign: 'center', cursor: 'pointer', background: 'white', display: 'block',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.background = 'rgba(0,122,100,0.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(12,12,12,0.25)'; e.currentTarget.style.background = 'white' }}
                  >
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: NAVY, display: 'block', marginBottom: 4 }}>Upload Logo</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(12,12,12,0.4)', display: 'block' }}>PNG or JPEG up to 5MB</span>
                  </label>
                </FormField>
                
                <FormField label="Reference Food Photos">
                  <label style={{ 
                    border: '1px dashed rgba(12,12,12,0.25)', borderRadius: 12, padding: 32, 
                    textAlign: 'center', cursor: 'pointer', background: 'white', display: 'block',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.background = 'rgba(0,122,100,0.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(12,12,12,0.25)'; e.currentTarget.style.background = 'white' }}
                  >
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: NAVY, display: 'block', marginBottom: 4 }}>Upload Photos</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(12,12,12,0.4)', display: 'block' }}>Improves AI image generation</span>
                  </label>
                </FormField>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  )
}

