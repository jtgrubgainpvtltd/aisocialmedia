import AIContentStudio from '../../components/AIContentStudio'

const NAVY = '#1a2332'

export default function ContentStudio() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.03em', color: NAVY, lineHeight: 1 }}>Content Studio</h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: 'rgba(12,12,12,0.5)', marginTop: 6 }}>AI-powered captions, images, and creatives in Hindi & English.</p>
      </div>
      <AIContentStudio />
    </div>
  )
}
