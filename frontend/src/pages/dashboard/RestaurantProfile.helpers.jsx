const NAVY = '#1a2332'

export const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(12,12,12,0.15)',
  borderRadius: 8,
  fontSize: '0.82rem',
  fontFamily: 'Inter, sans-serif',
  color: NAVY,
  background: 'white',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

export const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: '0.7rem',
  fontWeight: 600,
  color: NAVY,
  fontFamily: 'Inter, sans-serif',
}

export const EMPTY_FORM = {
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
}

export const mapRestaurantToForm = (restaurantData = {}) => ({
  name: restaurantData.restaurant_name || restaurantData.name || '',
  city: restaurantData.city || '',
  area: restaurantData.area || '',
  cuisine: restaurantData.cuisine_type || '',
  audience: restaurantData.target_audience || '',
  tone: restaurantData.brand_tone || '',
  language: restaurantData.language_preference || 'BILINGUAL',
  about: restaurantData.about_description || '',
  signatureDishes: restaurantData.signature_dishes || '',
  offers: restaurantData.standard_offers || '',
  hashtags: restaurantData.hashtags || '',
  phoneNumber: restaurantData.phone_number || '',
  contactEmail: restaurantData.contact_email || '',
  website: restaurantData.website || '',
  googleMapsUrl: restaurantData.google_maps_url || '',
  fullAddress: restaurantData.full_address || '',
  ownerName: restaurantData.owner_name || '',
  priceRange: restaurantData.price_range || '',
  avgOrderValue: restaurantData.avg_order_value !== null && restaurantData.avg_order_value !== undefined ? String(restaurantData.avg_order_value) : '',
  gstNumber: restaurantData.gst_number || '',
  fssaiLicense: restaurantData.fssai_license || '',
  instagramHandle: restaurantData.instagram_handle || '',
  facebookPage: restaurantData.facebook_page || '',
  twitterHandle: restaurantData.twitter_handle || '',
  tagline: restaurantData.tagline || '',
  brandColor: restaurantData.brand_color || '#E8640A',
  brandStory: restaurantData.brand_story || '',
})

export const getLogoUrl = (restaurantData, assets) => {
  const logoAsset = assets?.find((asset) => asset.asset_type === 'LOGO' && asset.file_url)
  return logoAsset?.file_url || restaurantData?.logo_url || ''
}

export const DetailItem = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(12,12,12,0.42)', fontFamily: 'Space Mono, monospace' }}>{label}</span>
    <span style={{ fontSize: '0.92rem', lineHeight: 1.5, color: NAVY, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
      {value || 'Not added yet'}
    </span>
  </div>
)

export const FormField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
)

