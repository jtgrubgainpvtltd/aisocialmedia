import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { content, posts, analytics } from '../api/client'
import { useQuery } from '@tanstack/react-query'
import { LANGUAGES, PLATFORMS, TONES } from '../constants/platforms'
import { useAuth } from '../context/AuthContext'
import ImageCropperModal from './ImageCropperModal'

const platforms = PLATFORMS.map(p => p.label)
const languages = LANGUAGES.map(l => l.label)
const tones = TONES.map(t => t.label)

const CAMPAIGN_TYPES = ['General Branding', 'Festival Greeting', 'Discount Offer', 'Menu Highlight']
const ASPECT_RATIOS = ['Square (1:1)', 'Story (9:16)', 'Landscape (16:9)']

const sizeMap = {
  'Square (1:1)': '1024x1024',
  'Story (9:16)': '1024x1792',
  'Landscape (16:9)': '1792x1024'
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[0.58rem] tracking-[0.14em] uppercase"
        style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dim)' }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-10 rounded-xl text-sm font-medium transition-all duration-150"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            fontFamily: 'Inter, sans-serif',
            backdropFilter: 'blur(10px)',
            appearance: 'none'
          }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ color: 'var(--fg-dim)' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  )
}

export default function AIContentStudio() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  
  const [platform, setPlatform] = useState(platforms[0])
  const [language, setLanguage] = useState(languages[0])
  const [tone, setTone] = useState(tones[0])
  
  // New configuration options
  const [campaignType, setCampaignType] = useState(CAMPAIGN_TYPES[0])
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0])
  
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [includeCTA, setIncludeCTA] = useState(true)
  const [addEmojis, setAddEmojis] = useState(true)
  const [autoHashtags, setAutoHashtags] = useState(true)
  
  // Generated content state
  const [captionEn, setCaptionEn] = useState('')
  const [captionHi, setCaptionHi] = useState('')
  const [hashtags, setHashtags] = useState([])
  const [imageUrl, setImageUrl] = useState('')

  // Cropper state
  const [showCropModal, setShowCropModal] = useState(false)

  // Pre-fill from URL params (e.g. from City Feed)
  useEffect(() => {
    const urlPrompt = searchParams.get('prompt')
    if (urlPrompt) {
      setPrompt(decodeURIComponent(urlPrompt))
    }
  }, [searchParams])

  // Scheduler state
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Fetch best times
  const { data: bestTimesData } = useQuery({
    queryKey: ['bestTimes'],
    queryFn: () => analytics.getBestTimes().then(r => r.data.data),
    staleTime: 1000 * 60 * 5 // 5 mins
  })
  const bestTimes = bestTimesData || []

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleTime) {
      setError('Please select both date and time to schedule.')
      return
    }
    setScheduling(true)
    setError('')
    try {
      const fullCaption = `${captionEn}\n\n${captionHi}\n\n${hashtags.join(' ')}`.trim()
      const res = await posts.schedule({
        platform: platform.toUpperCase(),
        scheduled_date: scheduleDate,
        scheduled_time: scheduleTime,
        caption: fullCaption,
        image_url: imageUrl,
      })
      if (res.data.success) {
        alert('Post scheduled successfully! You can view it in the Scheduler tab.')
        setShowScheduler(false)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to schedule post.')
    } finally {
      setScheduling(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerated(false)
    setError('')

    try {
      const { data } = await content.testFull({
        restaurantName: user?.restaurantName || user?.restaurant?.name || 'GrubGain Partner',
        restaurantType: user?.restaurant?.cuisine_type || 'Indian',
        city: user?.restaurant?.city || 'City',
        tone: tone.toLowerCase(),
        campaignType: campaignType,
        occasion: prompt || undefined,
        hashtags: autoHashtags ? ['GrubGain', 'FoodLovers', 'RestaurantLife'] : [],
        imageStyle: 'appetizing',
        imageSize: sizeMap[aspectRatio] || '1024x1024',
        imageQuality: 'standard',
        dalleStyle: 'vivid',
        language: language,
        platform: platform,
      })

      if (data.success) {
        const captionText = data.data.caption || ''
        
        // Try to split bilingual caption
        const parts = captionText.split(/\n{2,}/)
        if (parts.length >= 2) {
          setCaptionEn(parts[0].trim())
          setCaptionHi(parts[1].trim())
        } else {
          setCaptionEn(captionText)
          setCaptionHi('')
        }
        
        // Extract hashtags from caption
        const hashtagRegex = /#\w+/g
        const foundHashtags = captionText.match(hashtagRegex) || []
        setHashtags(foundHashtags.length > 0 ? foundHashtags : [])
        
        setImageUrl(data.data.imageUrl || '')
        setGenerated(true)
      } else {
        setError('Content generation failed. Please try again.')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.response?.data?.message || 'Failed to generate content. Check your API connection.')
    } finally {
      setGenerating(false)
    }
  }

  const handlePublishNow = async () => {
    if (!generated) {
      setError('Generate content first before publishing.')
      return
    }
    if (platform.toUpperCase() !== 'FACEBOOK' && platform.toUpperCase() !== 'INSTAGRAM') {
      setError('Publish Now currently supports Facebook and Instagram only.')
      return
    }
    if (platform.toUpperCase() === 'INSTAGRAM' && !imageUrl) {
      setError('Instagram publishing requires an image. Please generate with image.')
      return
    }

    setPublishing(true)
    setError('')
    try {
      const fullCaption = `${captionEn}\n\n${captionHi}\n\n${hashtags.join(' ')}`.trim()
      const res = await posts.publishNow({
        platform: platform.toUpperCase(),
        caption: fullCaption,
        image_url: imageUrl || null,
      })
      if (res.data.success) {
        alert(`Published successfully. Meta Post ID: ${res.data.data?.platform_post_id || 'N/A'}`)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to publish now.')
    } finally {
      setPublishing(false)
    }
  }

  const handleCopy = () => {
    const fullCaption = `${captionEn}\n\n${captionHi}\n\n${hashtags.join(' ')}`.trim()
    navigator.clipboard.writeText(fullCaption)
      .then(() => alert('Caption copied to clipboard!'))
      .catch(() => alert('Failed to copy'))
  }

  // Calculate aspect ratio for preview container
  const getPreviewAspectRatio = () => {
    if (aspectRatio === 'Story (9:16)') return '9 / 16';
    if (aspectRatio === 'Landscape (16:9)') return '16 / 9';
    return '1 / 1';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

      {/* ─── Left: Data Inputs ─── */}
      <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', borderRadius: 16, border: '1px solid rgba(12,12,12,0.08)', padding: 32, boxShadow: '0 2px 20px rgba(0,0,0,0.02)' }}>
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Unbounded, sans-serif', color: 'var(--fg)' }}>Content Configuration</h3>
          <p className="text-sm opacity-60" style={{ fontFamily: 'Inter, sans-serif' }}>Select your parameters and instruct the AI engine to generate your graphic poster and captions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <SelectField label="Campaign Type" options={CAMPAIGN_TYPES} value={campaignType} onChange={setCampaignType} />
          <SelectField label="Image Aspect Ratio" options={ASPECT_RATIOS} value={aspectRatio} onChange={setAspectRatio} />
          <SelectField label="Target Platform" options={platforms} value={platform} onChange={setPlatform} />
          <SelectField label="Caption Language" options={languages} value={language} onChange={setLanguage} />
          <SelectField label="Brand Voice Tone" options={tones} value={tone} onChange={setTone} />
        </div>

        {/* Prompt textarea */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[0.58rem] tracking-[0.14em] uppercase" style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dim)' }}>
            Custom Context / Offer Details <span style={{ color: 'var(--fg-dimmer)' }}>(optional)</span>
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={campaignType === 'Discount Offer' ? "e.g. 'Flat 20% OFF on all group orders exceeding ₹2000...'" : "e.g. 'Generate a beautiful poster for Diwali celebrating lights and food...'"}
            rows={3}
            className="w-full resize-none px-4 py-3 rounded-xl text-sm transition-all duration-150"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.65,
            }}
          />
        </div>

        {/* Settings row */}
        <div className="flex flex-wrap gap-4 p-4 rounded-xl mb-6" style={{ background: 'rgba(0,122,100,0.04)', border: '1px solid rgba(0,122,100,0.1)' }}>
          {[
            { label: 'Include Call-To-Action', checked: includeCTA, onChange: setIncludeCTA },
            { label: 'Add Emojis', checked: addEmojis, onChange: setAddEmojis },
            { label: 'Auto Hashtags', checked: autoHashtags, onChange: setAutoHashtags },
          ].map(opt => (
            <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={opt.checked} onChange={() => opt.onChange(v => !v)} className="accent-teal-600 cursor-pointer w-4 h-4" />
              <span className="text-[0.65rem] tracking-wide" style={{ fontFamily: 'Inter, sans-serif', color: '#1a2332', fontWeight: 600 }}>{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-6" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: '#dc2626', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-4 rounded-xl font-bold text-white tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-3"
          style={{
            fontFamily: 'Unbounded, sans-serif',
            fontSize: '0.7rem',
            background: generating ? 'rgba(0,122,100,0.6)' : 'linear-gradient(135deg, var(--teal) 0%, #00a486 100%)',
            boxShadow: generating ? 'none' : '0 4px 20px rgba(0,122,100,0.3)',
            border: 'none'
          }}
        >
          {generating ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Generating AI Graphic...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Generate Poster & Text
            </>
          )}
        </button>
      </div>

      {/* ─── Right: Dynamic Preview ─── */}
      <div style={{ background: '#1a2332', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(26,35,50,0.3)' }}>
        
        {/* Dynamic Image Area */}
        <div style={{ 
          width: '100%', 
          aspectRatio: getPreviewAspectRatio(), 
          background: generating ? 'rgba(255,255,255,0.05)' : '#0f141d',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden'
        }}>
          {generating ? (
            <div className="flex flex-col items-center gap-4 p-8 text-center animate-pulse">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Designing your {aspectRatio} promotional graphic based on your brand context...
              </div>
            </div>
          ) : generated && imageUrl ? (
            <img src={imageUrl} alt="AI Generated Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="flex flex-col items-center gap-4 p-8 text-center opacity-40">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Preview Area</span>
            </div>
          )}

          {/* Action Overlay */}
          {generated && imageUrl && !showScheduler && (
            <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowCropModal(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                  color: 'white', fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
                  fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.15s'
                }}
              >
                ✂️ Crop
              </button>
              
              <button
                onClick={() => setShowScheduler(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: 'var(--teal)', borderRadius: 8, border: 'none', cursor: 'pointer',
                  color: 'white', fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
                  fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.15s'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Schedule Post
              </button>

              <button
                onClick={handlePublishNow}
                disabled={publishing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: publishing ? 'rgba(232,100,10,0.75)' : '#E8640A', borderRadius: 8, border: 'none', cursor: 'pointer',
                  color: 'white', fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
                  fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.15s'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {publishing ? 'Publishing...' : 'Publish Now'}
              </button>

              <a 
                href={imageUrl} 
                download={`RestaurantPromo-${Date.now()}.png`} 
                target="_blank"
                rel="noreferrer"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: 'rgba(255,255,255,0.95)', borderRadius: 8, 
                  color: '#1a2332', textDecoration: 'none', fontFamily: 'Unbounded, sans-serif', fontWeight: 700,
                  fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.15s'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </a>
            </div>
          )}

          {/* Scheduler Form Overlay */}
          {showScheduler && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ color: 'white', fontFamily: 'Unbounded, sans-serif', fontSize: '1rem', margin: 0 }}>Schedule Post</h4>
                <button onClick={() => setShowScheduler(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', fontFamily: 'Inter, sans-serif' }} required />
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', fontFamily: 'Inter, sans-serif' }} required />
              </div>
              
              {bestTimes.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✨ AI Picks:</span>
                  {bestTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => setScheduleTime(time)}
                      style={{
                        padding: '4px 8px', borderRadius: 4, 
                        border: scheduleTime === time ? '1px solid var(--teal)' : '1px solid rgba(255,255,255,0.2)',
                        background: scheduleTime === time ? 'var(--teal)' : 'transparent',
                        color: 'white', fontFamily: 'Space Mono, monospace', fontSize: '0.65rem',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
              <button 
                onClick={handleSchedule}
                disabled={scheduling}
                style={{
                  padding: '12px', background: 'var(--teal)', color: 'white', borderRadius: 8, border: 'none',
                  fontFamily: 'Unbounded, sans-serif', fontSize: '0.7rem', textTransform: 'uppercase', cursor: scheduling ? 'not-allowed' : 'pointer'
                }}
              >
                {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          )}
        </div>

        {/* Text Preview Area */}
        <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.6rem] tracking-[0.15em] uppercase" style={{ fontFamily: 'Space Mono, monospace', color: 'rgba(255,255,255,0.4)' }}>
              Generated Copy
            </span>
            <button
              onClick={handleCopy}
              disabled={!generated}
              className="text-[0.55rem] tracking-wider uppercase px-2.5 py-1.5 rounded-lg transition-all font-bold"
              style={{ fontFamily: 'Space Mono, monospace', color: generated ? 'var(--teal)' : 'rgba(255,255,255,0.2)', background: generated ? 'rgba(0,122,100,0.1)' : 'transparent', border: 'none', cursor: generated ? 'pointer' : 'default' }}
            >
              Copy Text
            </button>
          </div>
          
          <div style={{ color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', lineHeight: 1.6 }}>
            {captionEn ? (
              <p className="mb-3">{captionEn}</p>
            ) : (
              <p className="opacity-40 italic">English caption will appear here...</p>
            )}
            
            {captionHi && (
              <p className="mb-3 opacity-90">{captionHi}</p>
            )}

            {hashtags.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-1.5">
                {hashtags.map((h, i) => (
                  <span key={i} style={{ color: 'var(--teal)' }}>{h.startsWith('#') ? h : `#${h}`}</span>
                ))}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Cropper Modal */}
      <ImageCropperModal 
        open={showCropModal} 
        imageSrc={imageUrl}
        onClose={() => setShowCropModal(false)}
        onCropCompleteCallback={(croppedBlobUrl) => {
          setImageUrl(croppedBlobUrl)
        }}
      />
    </div>
  )
}
