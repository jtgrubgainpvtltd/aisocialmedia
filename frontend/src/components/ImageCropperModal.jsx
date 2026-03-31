import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImage'
import BRANDING from '../constants/branding'

export default function ImageCropperModal({ open, imageSrc, onClose, onCropCompleteCallback }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1) // Default to 1:1
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setProcessing(true)
    try {
      const croppedImageBlobUrl = await getCroppedImg(imageSrc, croppedAreaPixels, 0)
      onCropCompleteCallback(croppedImageBlobUrl)
      onClose()
    } catch (e) {
      console.error(e)
      alert('Failed to crop image')
    } finally {
      setProcessing(false)
    }
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0, 0, 0, 0.85)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'white', fontFamily: 'Unbounded, sans-serif', fontSize: '1.2rem', margin: 0 }}>✂️ Adjust Image</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
      </div>

      {/* Main Content Areas */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        
        {/* Left: Cropper Container */}
        <div style={{ flex: 1, position: 'relative', background: '#0A0A0A' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Right: Controls Panel */}
        <div style={{ width: '320px', background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            
            <h3 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Aspect Ratio</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
              <button
                onClick={() => setAspect(1)}
                style={{ 
                  background: aspect === 1 ? 'var(--teal)' : 'rgba(255,255,255,0.1)', 
                  border: aspect === 1 ? '1px solid var(--teal)' : '1px solid rgba(255,255,255,0.2)',
                  color: 'white', padding: '12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', transition: 'all 0.15s'
                }}
              >1:1 (Square)</button>
              <button
                onClick={() => setAspect(4 / 5)}
                style={{ 
                  background: aspect === 4/5 ? 'var(--teal)' : 'rgba(255,255,255,0.1)', 
                  border: aspect === 4/5 ? '1px solid var(--teal)' : '1px solid rgba(255,255,255,0.2)',
                  color: 'white', padding: '12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', transition: 'all 0.15s'
                }}
              >4:5 (Portrait)</button>
              <button
                onClick={() => setAspect(16 / 9)}
                style={{ 
                  background: aspect === 16/9 ? 'var(--teal)' : 'rgba(255,255,255,0.1)', 
                  border: aspect === 16/9 ? '1px solid var(--teal)' : '1px solid rgba(255,255,255,0.2)',
                  color: 'white', padding: '12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', transition: 'all 0.15s', gridColumn: 'span 2'
                }}
              >16:9 (Landscape)</button>
            </div>

            <h3 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Zoom</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
               <span style={{color: 'rgba(255,255,255,0.5)'}}>-</span>
               <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--teal)' }}
              />
              <span style={{color: 'rgba(255,255,255,0.5)'}}>+</span>
            </div>

          </div>

          <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12 }}>
             <button
               onClick={onClose}
               style={{ 
                 flex: 1, padding: 14, background: 'transparent',
                 border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                 borderRadius: 8, fontFamily: 'Inter, sans-serif', fontWeight: 600, cursor: 'pointer'
               }}
             >
               Cancel
             </button>
             <button
               onClick={handleCropConfirm}
               disabled={processing}
               style={{ 
                 flex: 2, padding: 14, background: 'var(--teal)',
                 border: 'none', color: 'white',
                 borderRadius: 8, fontFamily: 'Unbounded, sans-serif', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', 
                 opacity: processing ? 0.7 : 1, transition: 'all 0.15s'
               }}
             >
               {processing ? 'Cropping...' : 'Crop & Use'}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
