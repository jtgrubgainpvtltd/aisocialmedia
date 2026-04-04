import React, { useState } from 'react';
import SecureImage from './ui/SecureImage';

/* ── Shared sub-components ────────────────────────────────────────── */

const Avatar = ({ url, fallback, size = 32, isDark = false }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', 
    background: isDark ? '#262626' : 'linear-gradient(135deg, #f0f2f5 0%, #e4e6ea 100%)',
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    overflow: 'hidden',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
  }}>
    {url
      ? <SecureImage src={url} alt={`${fallback || 'Restaurant'} profile logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <span style={{ fontSize: size * 0.42, fontWeight: 700, color: isDark ? '#efefef' : '#555' }}>
          {fallback?.[0]?.toUpperCase() || 'R'}
        </span>
    }
  </div>
);

const ImageSlot = ({ imageUrl, aspectRatio = '1 / 1', generating, isDark = false }) => (
  <div style={{
    width: '100%', aspectRatio, 
    background: isDark ? '#000' : '#f0f2f5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
    borderTop: isDark ? '1px solid #262626' : 'none',
    borderBottom: isDark ? '1px solid #262626' : 'none',
  }}>
    {generating ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'pulse 2s infinite' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#444' : '#bbb'} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
        <span style={{ fontSize: 12, color: isDark ? '#666' : '#999', fontFamily: 'Inter, sans-serif' }}>Generating…</span>
      </div>
    ) : imageUrl ? (
      <SecureImage src={imageUrl} alt="Generated social media creative" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: isDark ? '#000' : '#f0f2f5' }} />
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#333' : '#ccc'} strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
        <span style={{ fontSize: 12, color: isDark ? '#555' : '#bbb', fontFamily: 'Inter, sans-serif' }}>Preview</span>
      </div>
    )}
  </div>
);

const CaptionBlock = ({ en, hi, placeholder = 'Caption will appear here…', color = '#262626' }) => (
  <div style={{ fontSize: 13, lineHeight: 1.55, color, fontFamily: 'system-ui, -apple-system, sans-serif', whiteSpace: 'pre-line' }}>
    {en && <div>{en}</div>}
    {hi && <div style={{ marginTop: 4, opacity: 0.85 }}>{hi}</div>}
    {!en && !hi && <div style={{ opacity: 0.35, fontStyle: 'italic' }}>{placeholder}</div>}
  </div>
);


/* ═══════════════════════════════════════════════════════════════════
   INSTAGRAM POST
   ═══════════════════════════════════════════════════════════════════ */
export const PreviewInstagramPost = ({ imageUrl, captionEn, captionHi, restaurantName, avatarUrl, generating, language = 'English', aspectRatio = '1 / 1', isDark = false }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const bgColor = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#f5f5f5' : '#262626';
  const borderColor = isDark ? '#262626' : '#dbdbdb';

  return (
    <div style={{ width: '100%', maxWidth: 380, background: bgColor, borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: `1px solid ${borderColor}` }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10 }}>
        <Avatar url={avatarUrl} fallback={restaurantName} size={32} isDark={isDark} />
        <div style={{ fontWeight: 600, fontSize: 14, color: textColor, fontFamily: 'system-ui, sans-serif' }}>{restaurantName || 'Your Restaurant'}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: isDark ? '#a8a8a8' : '#262626' }} />
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: isDark ? '#a8a8a8' : '#262626' }} />
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: isDark ? '#a8a8a8' : '#262626' }} />
        </div>
      </div>

      <ImageSlot 
        imageUrl={imageUrl} 
        aspectRatio={aspectRatio} 
        generating={generating} 
        isDark={isDark}
      />

      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 16 }}>
        <svg 
          onClick={() => setLiked(!liked)}
          width="24" height="24" viewBox="0 0 24 24" fill={liked ? '#ed4956' : 'none'} stroke={liked ? '#ed4956' : textColor} strokeWidth="1.8" 
          style={{ cursor: 'pointer' }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="1.8" style={{ cursor: 'pointer' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="1.8" style={{ cursor: 'pointer' }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        <svg 
          onClick={() => setSaved(!saved)}
          width="24" height="24" viewBox="0 0 24 24" fill={saved ? (isDark ? '#fff' : '#000') : 'none'} stroke={textColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" 
          style={{ cursor: 'pointer', marginLeft: 'auto' }}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <div style={{ padding: '0 14px', fontWeight: 600, fontSize: 13, color: textColor, fontFamily: 'system-ui, sans-serif' }}>
        {liked ? 129 : 128} likes
      </div>

      <div style={{ padding: '6px 14px 14px' }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: textColor, marginRight: 6, fontFamily: 'system-ui, sans-serif' }}>{restaurantName || 'restaurant'}</span>
        <CaptionBlock en={captionEn} hi={captionHi} placeholder={`No ${language} caption generated…`} color={isDark ? '#efefef' : '#262626'} />
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   INSTAGRAM STORY
   ═══════════════════════════════════════════════════════════════════ */
export const PreviewInstagramStory = ({ imageUrl, restaurantName, avatarUrl, generating }) => (
  <div style={{ width: '100%', maxWidth: 280, aspectRatio: '9 / 16', background: '#000', borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
    {generating ? (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 13, color: '#888', animation: 'pulse 2s infinite' }}>Generating…</span>
      </div>
    ) : imageUrl ? (
      <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Instagram story preview creative" />
    ) : (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
        <span style={{ fontSize: 13, color: '#555' }}>Story Preview</span>
      </div>
    )}
    <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }}>
      <div style={{ width: '40%', height: '100%', borderRadius: 2, background: '#fff' }} />
    </div>
    <div style={{ position: 'absolute', top: 18, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar url={avatarUrl} fallback={restaurantName} size={28} />
      <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{restaurantName || 'Your Restaurant'}</div>
    </div>
  </div>
);


/* ═══════════════════════════════════════════════════════════════════
   TWITTER / X POST
   ═══════════════════════════════════════════════════════════════════ */
export const PreviewTwitter = ({ imageUrl, captionEn, captionHi, restaurantName, avatarUrl, generating, language = 'English', aspectRatio = '1 / 1', isDark = false }) => {
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);

  const bgColor = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#fff' : '#0f1419';
  const dimColor = isDark ? '#71767b' : '#536471';
  const borderColor = isDark ? '#2f3336' : '#eff3f4';

  return (
    <div style={{ width: '100%', maxWidth: 420, background: bgColor, borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: `1px solid ${borderColor}`, display: 'flex', gap: 12 }}>
      <Avatar url={avatarUrl} fallback={restaurantName} size={40} isDark={isDark} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: textColor }}>{restaurantName || 'Your Restaurant'}</span>
          <span style={{ color: dimColor, fontSize: 14 }}>@{(restaurantName || 'restaurant').replace(/\s+/g, '').toLowerCase()}</span>
          <span style={{ color: dimColor, fontSize: 14 }}>· 2h</span>
        </div>
        <div style={{ marginTop: 4 }}>
          <CaptionBlock en={captionEn} hi={captionHi} placeholder={`No ${language} caption generated…`} color={textColor} />
        </div>
        <div style={{ marginTop: 12, width: '100%', borderRadius: 16, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
          <ImageSlot 
            imageUrl={imageUrl} 
            aspectRatio={aspectRatio} 
            generating={generating} 
            isDark={isDark}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: dimColor, maxWidth: 280 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z" /></svg>
          <svg onClick={() => setRetweeted(!retweeted)} viewBox="0 0 24 24" width="18" height="18" fill={retweeted ? '#00ba7c' : 'currentColor'} style={{ cursor: 'pointer' }}><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" /></svg>
          <svg onClick={() => setLiked(!liked)} viewBox="0 0 24 24" width="18" height="18" fill={liked ? '#f91880' : 'currentColor'} style={{ cursor: 'pointer' }}><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z" /></svg>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" /></svg>
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   FACEBOOK POST
   ═══════════════════════════════════════════════════════════════════ */
export const PreviewFacebook = ({ imageUrl, captionEn, captionHi, restaurantName, avatarUrl, generating, language = 'English', aspectRatio = '1 / 1', isDark = false }) => {
  const [liked, setLiked] = useState(false);

  const bgColor = isDark ? '#242526' : '#fff';
  const textColor = isDark ? '#e4e6eb' : '#050505';
  const dimColor = isDark ? '#b0b3b8' : '#65676B';
  const borderColor = isDark ? '#3e4042' : '#e4e6eb';

  return (
    <div style={{ width: '100%', maxWidth: 420, background: bgColor, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: `1px solid ${borderColor}` }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10 }}>
        <Avatar url={avatarUrl} fallback={restaurantName} size={40} isDark={isDark} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: textColor, lineHeight: 1.2 }}>{restaurantName || 'Your Restaurant'}</div>
          <div style={{ fontSize: 12, color: dimColor, display: 'flex', alignItems: 'center', gap: 4 }}>2h · 🌐</div>
        </div>
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <CaptionBlock en={captionEn} hi={captionHi} placeholder={`No ${language} caption generated…`} color={textColor} />
      </div>
      <ImageSlot 
        imageUrl={imageUrl} 
        aspectRatio={aspectRatio} 
        generating={generating} 
        isDark={isDark}
      />
      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: dimColor, borderBottom: `1px solid ${borderColor}` }}>
        <span>{liked ? '👍❤️ 25' : '👍❤️ 24'}</span>
        <span>3 comments</span>
      </div>
      <div style={{ display: 'flex', borderTop: `1px solid ${borderColor}` }}>
        <button 
          onClick={() => setLiked(!liked)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', fontSize: 14, fontWeight: 600, color: liked ? '#1877f2' : dimColor, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {liked ? '💙 Liked' : '👍 Like'}
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', fontSize: 14, fontWeight: 600, color: dimColor, cursor: 'pointer' }}>💬 Comment</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', fontSize: 14, fontWeight: 600, color: dimColor, cursor: 'pointer' }}>↗ Share</div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════
   WHATSAPP STATUS
   ═══════════════════════════════════════════════════════════════════ */
export const PreviewWhatsApp = ({ imageUrl, captionEn, captionHi, generating }) => (
  <div style={{ width: '100%', maxWidth: 280, aspectRatio: '9 / 16', background: '#0b141a', borderRadius: 16, overflow: 'hidden', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '10px 12px 6px', background: '#1f2c34', display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#e9edef' }}>My Status</div>
        <div style={{ fontSize: 11, color: '#8696a0' }}>Today</div>
      </div>
    </div>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {generating ? (
        <span style={{ fontSize: 13, color: '#666', animation: 'pulse 2s infinite' }}>Generating…</span>
      ) : imageUrl ? (
        <img src={imageUrl} style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="WA Status" />
      ) : (
        <span style={{ fontSize: 13, color: '#333' }}>Status View</span>
      )}
    </div>
    <div style={{ padding: '10px 16px', background: '#1f2c34', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ flex: 1, height: 36, borderRadius: 20, background: '#2a3942', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
        <span style={{ fontSize: 13, color: '#8696a0' }}>Reply</span>
      </div>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2" style={{ marginLeft: 10 }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    </div>
  </div>
);
