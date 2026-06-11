import React, { useState, useRef, useEffect } from 'react';
import { useCloud } from '../context/CloudContext';
import { applyAIRetouch } from '../utils/AIRetoucher';
import { Sliders, Sparkles, AlertCircle, RefreshCw, Layers, Type, Shield, Upload, Trash2, SlidersHorizontal, ZoomIn, X, Maximize2 } from 'lucide-react';
import { parseLightroomPreset } from '../utils/presetParser';

const FRAME_PRESETS = [
  { id: 'none', name: 'Tanpa Banner', desc: 'Foto bersih tanpa banner dekoratif', icon: '❌' },
  { id: 'polaroid', name: 'Classic White Banner', desc: 'Banner putih minimalis di bawah foto', icon: '📸' },
  { id: 'wedding_gold', name: 'Elegant Wedding Gold', desc: 'Banner emas & sulur dekoratif mewah', icon: '👑' },
  { id: 'botanical', name: 'Sage Botanical', desc: 'Banner hijau sage & sulur daun emas', icon: '🌿' },
  { id: 'minimal_black', name: 'Minimalist Slate', desc: 'Banner hitam tipis dengan info metadata', icon: '🖤' },
  { id: 'retro_film', name: 'Retro Film 35mm', desc: 'Banner klise film hitam & lubang sprocket', icon: '🎞️' },
  { id: 'midnight_luxury', name: 'Midnight Blue', desc: 'Banner navy & garis geometris emas', icon: '💎' },
  { id: 'neon_glow', name: 'Cyberpunk Neon', desc: 'Banner gelap & garis neon cyan-magenta', icon: '⚡' },
  { id: 'soft_vignette', name: 'Sunset Silhouette', desc: 'Banner gradasi senja & siluet daun palem', icon: '☁️' },
  { id: 'silver_sparkles', name: 'Silver Sparkles', desc: 'Banner perak & bintang berkelip cantik', icon: '✨' },
  { id: 'rose_gold_floral', name: 'Rose Gold Floral', desc: 'Banner pink & sulur mawar manis', icon: '🌸' },
  { id: 'vintage_paper', name: 'Vintage Parchment', desc: 'Banner kertas usang & dekorasi klasik', icon: '📜' },
  { id: 'cyberpunk_grid', name: 'Cyber Tech Grid', desc: 'Banner digital grid & indikator target', icon: '👾' },
  { id: 'cherry_blossom', name: 'Sakura Blossom', desc: 'Banner kelopak sakura berguguran', icon: '🏵️' },
  { id: 'luxury_marble', name: 'Luxury Marble', desc: 'Banner marmer hitam & serat emas', icon: '🏛️' },
  { id: 'christmas_holiday', name: 'Holiday Evergreen', desc: 'Banner merah festival & daun cemara', icon: '🎄' },
  { id: 'custom', name: 'Unggah Kustom', desc: 'Gunakan file desain PNG Anda', icon: '📤' }
];

const compressPNG = (base64Str: string, maxDim: number = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};


const PRESET_INFOS = [
  { 
    id: 'none',
    name: 'Tanpa Preset (No Preset)',
    description: 'Menampilkan foto asli kamera tanpa koreksi warna AI.',
    speed: '10ms'
  },
  { 
    id: 'wedding', 
    name: 'Wedding Soft/Warm', 
    description: 'Meningkatkan eksposur, memperlembut kontras, dan memberikan rona kulit peachy yang romantis.', 
    speed: '110ms' 
  },
  { 
    id: 'sports', 
    name: 'Vivid Action Sport', 
    description: 'Meningkatkan kontras dan saturasi midtone untuk warna olahraga yang dinamis dan berenergi.', 
    speed: '95ms' 
  },
  { 
    id: 'cinematic', 
    name: 'Moody Cinematic', 
    description: 'Split toning Teal & Orange. Menekankan highlight dan menambahkan efek vignette gelap di sudut foto.', 
    speed: '140ms' 
  },
  { 
    id: 'monochrome', 
    name: 'Classic Noir B&W', 
    description: 'Skala abu-abu kontras tinggi yang mendalam dengan tekstur kaya dan grain film prosedural.', 
    speed: '120ms' 
  },
  {
    id: 'custom',
    name: 'Preset Custom (Lightroom)',
    description: 'Unggah file preset Adobe Lightroom (.xmp / .lrtemplate / .dng) Anda untuk diaplikasikan otomatis.',
    speed: '130ms'
  },
  {
    id: 'manual',
    name: 'Atur Sendiri',
    description: 'Kustomisasi parameter secara manual dengan slider kecerahan, kontras, saturasi, eksposur, dan kehangatan.',
    speed: '115ms'
  }
];

// High quality sample portrait for retouch comparisons
const PREVIEW_SAMPLE = '/wedding_preview.png';

export const RetouchProfilesView: React.FC = () => {
  const { 
    activePreset, 
    setActivePreset, 
    isAutoRetouchEnabled, 
    setIsAutoRetouchEnabled,
    watermarkText,
    watermarkTextLine1,
    setWatermarkTextLine1,
    watermarkTextLine2,
    setWatermarkTextLine2,
    watermarkTextLine3,
    setWatermarkTextLine3,
    watermarkOpacity,
    setWatermarkOpacity,
    watermarkSize,
    setWatermarkSize,
    watermarkType,
    setWatermarkType,
    watermarkImage,
    setWatermarkImage,
    watermarkFont,
    watermarkFontLine1,
    setWatermarkFontLine1,
    watermarkFontLine2,
    setWatermarkFontLine2,
    watermarkFontLine3,
    setWatermarkFontLine3,
    watermarkFramePreset,
    setWatermarkFramePreset,
    isFacialSmoothingEnabled,
    setIsFacialSmoothingEnabled,
    isPlateBlurringEnabled,
    setIsPlateBlurringEnabled,
    isBlurryFilterEnabled,
    setIsBlurryFilterEnabled,
    
    // New parameters
    manualBrightness,
    setManualBrightness,
    manualContrast,
    setManualContrast,
    manualSaturation,
    setManualSaturation,
    manualExposure,
    setManualExposure,
    manualWarmth,
    setManualWarmth,
    customPresetName,
    setCustomPresetName,
    customBrightness,
    setCustomBrightness,
    customContrast,
    setCustomContrast,
    customSaturation,
    setCustomSaturation,
    customExposure,
    setCustomExposure,
    customWarmth,
    setCustomWarmth
  } = useCloud();

  const [sliderPos, setSliderPos] = useState<number>(22);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [originalUrl] = useState<string>(PREVIEW_SAMPLE);
  const [retouchedUrl, setRetouchedUrl] = useState<string>(PREVIEW_SAMPLE);
  const [loading, setLoading] = useState<boolean>(false);


  // Apply selected preset and watermarking options to preview
  useEffect(() => {
    const generatePreview = async () => {
      setLoading(true);
      try {
        const mSettings = activePreset === 'custom'
          ? {
              brightness: customBrightness,
              contrast: customContrast,
              saturation: customSaturation,
              exposure: customExposure,
              warmth: customWarmth
            }
          : {
              brightness: manualBrightness,
              contrast: manualContrast,
              saturation: manualSaturation,
              exposure: manualExposure,
              warmth: manualWarmth
            };

        const retouched = await applyAIRetouch(originalUrl, activePreset, {
          text: watermarkText,
          opacity: watermarkOpacity,
          size: watermarkSize,
          smoothFace: isFacialSmoothingEnabled,
          blurPlates: isPlateBlurringEnabled,
          type: watermarkType,
          image: watermarkImage,
          font: watermarkFont,
          framePreset: watermarkFramePreset,
          textLine1: watermarkTextLine1,
          textLine2: watermarkTextLine2,
          textLine3: watermarkTextLine3,
          fontLine1: watermarkFontLine1,
          fontLine2: watermarkFontLine2,
          fontLine3: watermarkFontLine3
        }, mSettings);
        setRetouchedUrl(retouched);
      } catch (err) {
        console.error('Failed to generate preview image:', err);
      } finally {
        setLoading(false);
      }
    };
    generatePreview();
  }, [
    activePreset, 
    originalUrl, 
    watermarkText, 
    watermarkOpacity, 
    watermarkSize, 
    watermarkType,
    watermarkImage,
    watermarkFont,
    watermarkFramePreset,
    watermarkTextLine1,
    watermarkTextLine2,
    watermarkTextLine3,
    watermarkFontLine1,
    watermarkFontLine2,
    watermarkFontLine3,
    isFacialSmoothingEnabled, 
    isPlateBlurringEnabled,
    manualBrightness,
    manualContrast,
    manualSaturation,
    manualExposure,
    manualWarmth,
    customBrightness,
    customContrast,
    customSaturation,
    customExposure,
    customWarmth
  ]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const selectFramePreset = (presetId: string) => {
    setWatermarkFramePreset(presetId);
    const isTextActive = watermarkType === 'text' || watermarkType === 'both';
    if (presetId === 'none') {
      setWatermarkType(isTextActive ? 'text' : 'none');
    } else {
      setWatermarkType(isTextActive ? 'both' : 'image');
    }
  };


  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', flex: 1, minHeight: 0 }}>
      
      {/* Left Column: Draggable split slider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
        
        {/* Header Bar */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} className="text-gradient" /> Kustomisasi Preset AI
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Geser garis tengah untuk membandingkan foto asli kamera dengan preset AI kami
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mesin Otomatis:</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isAutoRetouchEnabled} 
                onChange={(e) => setIsAutoRetouchEnabled(e.target.checked)} 
                />
              <span className="switch-slider" />
            </label>
          </div>
        </div>

        {/* Live Slider Canvas – fixed 16:9 */}
        <div
          style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '50vh', background: '#0a0a0c', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          {/* Draggable comparison area */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            className="slider-container"
            style={{ width: '100%', height: '100%', cursor: 'ew-resize', position: 'relative', background: '#0a0a0c' }}
          >
            {/* Before */}
            <div className="slider-image-before">
              <img src={originalUrl} alt="Original unretouched shot" style={{ pointerEvents: 'none' }} />
              <span style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                FOTO ASLI
              </span>
            </div>

            {/* After */}
            <div
              className="slider-image-after"
              style={{
                clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                position: 'absolute',
                inset: 0
              }}
            >
              <img src={retouchedUrl} alt="AI retouched preview" style={{ pointerEvents: 'none' }} />
              <span style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 10, background: 'var(--primary-grad)', padding: '3px 7px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, color: 'white' }}>
                HASIL AI
              </span>
            </div>

            {/* Divider */}
            <div className="slider-bar" style={{ left: `${sliderPos}%` }}>
              <div className="slider-handle">
                <Sparkles size={14} />
              </div>
            </div>

            {/* Spinner */}
            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                  <span style={{ fontSize: '0.8rem' }}>Retouch AI...</span>
                </div>
              </div>
            )}
          </div>

          {/* Expand / Lightbox button */}
          <button
            onClick={() => setLightboxOpen(true)}
            title="Lihat detail foto hasil retouch"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 20,
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '5px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 600,
              backdropFilter: 'blur(6px)',
              transition: 'background 0.2s'
            }}
          >
            <Maximize2 size={12} />
            Lihat Detail
          </button>
        </div>
      </div>

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'zoom-out',
            backdropFilter: 'blur(8px)'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              zIndex: 1001,
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>

          {/* Label */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ZoomIn size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Hasil Retouch AI — Klik di mana saja untuk tutup</span>
          </div>

          {/* Full image */}
          <img
            src={retouchedUrl}
            alt="Full resolution AI retouched result"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '88vh',
              objectFit: 'contain',
              borderRadius: '10px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              cursor: 'default',
              display: 'block'
            }}
          />
        </div>
      )}

      {/* Right Column: AI preset list, watermarks, face beautification controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px', flexShrink: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 100px)', paddingRight: '4px' }}>
        
        {/* Preset profile list */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={16} className="text-gradient" /> Gradasi Warna AI
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRESET_INFOS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => setActivePreset(preset.id)}
                  className="glass-card"
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                    background: isActive ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-card)',
                    borderLeft: isActive ? '3px solid var(--primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {preset.name}
                    </h4>
                    <span className="badge badge-violet" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                      {preset.speed}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Adjustments Panel */}
        {activePreset === 'manual' && (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={16} className="text-gradient" /> Kustomisasi Manual
            </h3>

            {/* Brightness */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Kecerahan (Brightness)</span>
                <span>{manualBrightness.toFixed(2)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.05"
                value={manualBrightness} 
                onChange={(e) => setManualBrightness(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Contrast */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Kontras (Contrast)</span>
                <span>{manualContrast.toFixed(2)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.05"
                value={manualContrast} 
                onChange={(e) => setManualContrast(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Saturation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Saturasi (Saturation)</span>
                <span>{manualSaturation.toFixed(2)}x</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="2.0" 
                step="0.05"
                value={manualSaturation} 
                onChange={(e) => setManualSaturation(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Exposure */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Eksposur (Exposure Bias)</span>
                <span>{manualExposure >= 0 ? `+${manualExposure.toFixed(2)}` : manualExposure.toFixed(2)} EV</span>
              </div>
              <input 
                type="range" 
                min="-2.0" 
                max="2.0" 
                step="0.1"
                value={manualExposure} 
                onChange={(e) => setManualExposure(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Warmth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Suhu Warna (Warmth)</span>
                <span>{manualWarmth >= 0 ? `+${manualWarmth.toFixed(2)}` : manualWarmth.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="-1.0" 
                max="1.0" 
                step="0.05"
                value={manualWarmth} 
                onChange={(e) => setManualWarmth(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '8px', fontSize: '0.75rem', marginTop: '4px' }}
              onClick={() => {
                setManualBrightness(1.0);
                setManualContrast(1.0);
                setManualSaturation(1.0);
                setManualExposure(0.0);
                setManualWarmth(0.0);
              }}
            >
              Reset ke Default
            </button>
          </div>
        )}

        {/* Lightroom Custom Preset Panel */}
        {activePreset === 'custom' && (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} className="text-gradient-cyan" /> Lightroom Preset Custom
            </h3>

            {customPresetName ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  background: 'var(--btn-secondary-bg)', 
                  border: '1px solid var(--border-color)' 
                }}>
                  <div style={{ minWidth: 0, marginRight: '8px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customPresetName}
                    </p>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Lightroom Preset File</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPresetName(null);
                      setCustomBrightness(1.0);
                      setCustomContrast(1.0);
                      setCustomSaturation(1.0);
                      setCustomExposure(0.0);
                      setCustomWarmth(0.0);
                    }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#f87171' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', borderRadius: '6px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Kecerahan</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{customBrightness.toFixed(2)}x</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Kontras</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{customContrast.toFixed(2)}x</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Saturasi</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{customSaturation.toFixed(2)}x</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Eksposur</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{customExposure >= 0 ? `+${customExposure.toFixed(2)}` : customExposure.toFixed(2)}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>Kehangatan</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{customWarmth >= 0 ? `+${customWarmth.toFixed(2)}` : customWarmth.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                  onClick={() => document.getElementById('lr-preset-file-uploader')?.click()}
                  style={{
                    height: '100px',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)',
                    background: 'var(--btn-secondary-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    gap: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    padding: '12px'
                  }}
                >
                  <Upload size={20} className="text-gradient" style={{ marginBottom: '2px' }} />
                  <span>Klik untuk unggah file preset</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Mendukung format .xmp, .lrtemplate, & .dng (Lightroom Mobile)</span>
                  
                  <input
                    type="file"
                    id="lr-preset-file-uploader"
                    accept=".xmp,.lrtemplate,.dng"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          try {
                            const parsed = parseLightroomPreset(content);
                            setCustomPresetName(file.name);
                            setCustomBrightness(parsed.brightness);
                            setCustomContrast(parsed.contrast);
                            setCustomSaturation(parsed.saturation);
                            setCustomExposure(parsed.exposure);
                            setCustomWarmth(parsed.warmth);
                          } catch (err) {
                            console.error('Failed to parse preset file:', err);
                            alert('Gagal mengurai file preset. Pastikan format file sesuai.');
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

          {/* Batch Watermarking editor */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Type size={16} className="text-gradient-cyan" /> Desain & Watermark Event
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
            Sesuaikan bingkai overlay premium dan teks penanda event untuk hasil jepretan kamera
          </p>

          {/* Template Selection Grid - Always Visible! */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pilih Desain Bingkai Premium</label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px', 
              maxHeight: '220px', 
              overflowY: 'auto',
              paddingRight: '4px'
            }} className="custom-scrollbar">
              {FRAME_PRESETS.map((preset) => {
                const isSelected = watermarkFramePreset === preset.id;
                return (
                  <div 
                    key={preset.id}
                    onClick={() => selectFramePreset(preset.id)}
                    className="glass-card"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-glow)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      transition: 'all 0.2s',
                      userSelect: 'none',
                      boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'none',
                      transform: isSelected ? 'scale(0.98)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{preset.icon}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>{preset.name}</span>
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>{preset.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom File Upload Zone (only if custom preset is selected) */}
          {watermarkFramePreset === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1.5px dashed var(--border-color)', paddingTop: '10px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>File Bingkai Kustom (PNG Transparan)</label>
              {watermarkImage ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ 
                    height: '80px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--bg-overlay)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden' 
                  }}>
                    <img src={watermarkImage} alt="Watermark template thumbnail" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setWatermarkImage(null)}
                    className="btn btn-danger"
                    style={{ padding: '6px', fontSize: '0.75rem', width: '100%' }}
                  >
                    Hapus Bingkai
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => document.getElementById('frame-file-uploader')?.click()}
                  style={{
                    height: '70px',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)',
                    background: 'var(--btn-secondary-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    gap: '4px',
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem'
                  }}
                >
                  <span>Klik untuk pilih file PNG/JPG</span>
                  <input
                    type="file"
                    id="frame-file-uploader"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const originalData = event.target?.result as string;
                          compressPNG(originalData, 1200)
                            .then((compressed) => {
                              setWatermarkImage(compressed);
                            })
                            .catch((err) => {
                              console.error('Error compressing uploaded frame:', err);
                              setWatermarkImage(originalData);
                            });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Watermark Teks Switch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              background: 'var(--btn-secondary-bg)', 
              border: '1px solid var(--border-color)', 
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>✍️ Aktifkan Watermark Teks</span>
              <input 
                type="checkbox" 
                checked={watermarkType === 'text' || watermarkType === 'both'} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  const isFrameActive = watermarkFramePreset !== 'none';
                  if (checked) {
                    setWatermarkType(isFrameActive ? 'both' : 'text');
                  } else {
                    setWatermarkType(isFrameActive ? 'image' : 'none');
                  }
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Section: Text Customizer */}
          {(watermarkType === 'text' || watermarkType === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '-4px' }}>
                💡 Isi 3 baris teks dan pilih font masing-masing untuk banner overlay yang elegan.
              </p>

              {/* LINE 1 – Title (e.g. The Wedding of) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderRadius: '8px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Baris 1 — Judul</span>
                <input
                  type="text"
                  value={watermarkTextLine1}
                  onChange={(e) => setWatermarkTextLine1(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.8rem', padding: '7px 10px' }}
                  placeholder="The Wedding of"
                />
                <select
                  value={watermarkFontLine1}
                  onChange={(e) => setWatermarkFontLine1(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.78rem', padding: '6px 8px', cursor: 'pointer' }}
                >
                  <optgroup label="Modern Sans-Serif">
                    <option value="Outfit">Outfit (Sans)</option>
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Montserrat">Montserrat (Sans)</option>
                    <option value="Cinzel">Cinzel (Serif)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                  </optgroup>
                  <optgroup label="Script & Calligraphy">
                    <option value="Sacramento">Sacramento (Script)</option>
                    <option value="Great Vibes">Great Vibes (Calligraphy)</option>
                    <option value="Alex Brush">Alex Brush (Brush)</option>
                    <option value="Pacifico">Pacifico (Fun)</option>
                  </optgroup>
                </select>
              </div>

              {/* LINE 2 – Names (e.g. Bella & Thoyyib) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderRadius: '8px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Baris 2 — Nama Mempelai</span>
                <input
                  type="text"
                  value={watermarkTextLine2}
                  onChange={(e) => setWatermarkTextLine2(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.8rem', padding: '7px 10px' }}
                  placeholder="Bella & Thoyyib"
                />
                <select
                  value={watermarkFontLine2}
                  onChange={(e) => setWatermarkFontLine2(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.78rem', padding: '6px 8px', cursor: 'pointer' }}
                >
                  <optgroup label="Script & Calligraphy">
                    <option value="Great Vibes">Great Vibes (Calligraphy)</option>
                    <option value="Sacramento">Sacramento (Script)</option>
                    <option value="Alex Brush">Alex Brush (Brush)</option>
                    <option value="Pacifico">Pacifico (Fun)</option>
                  </optgroup>
                  <optgroup label="Modern Sans-Serif">
                    <option value="Outfit">Outfit (Sans)</option>
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Montserrat">Montserrat (Sans)</option>
                    <option value="Cinzel">Cinzel (Serif)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                  </optgroup>
                </select>
              </div>

              {/* LINE 3 – Date (e.g. 07 June 2026) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderRadius: '8px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(234, 179, 8, 0.9)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Baris 3 — Tanggal Acara</span>
                <input
                  type="text"
                  value={watermarkTextLine3}
                  onChange={(e) => setWatermarkTextLine3(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.8rem', padding: '7px 10px' }}
                  placeholder="07 June 2026"
                />
                <select
                  value={watermarkFontLine3}
                  onChange={(e) => setWatermarkFontLine3(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.78rem', padding: '6px 8px', cursor: 'pointer' }}
                >
                  <optgroup label="Modern Sans-Serif">
                    <option value="Outfit">Outfit (Sans)</option>
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Montserrat">Montserrat (Sans)</option>
                    <option value="Cinzel">Cinzel (Serif)</option>
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                  </optgroup>
                  <optgroup label="Script & Calligraphy">
                    <option value="Sacramento">Sacramento (Script)</option>
                    <option value="Great Vibes">Great Vibes (Calligraphy)</option>
                    <option value="Alex Brush">Alex Brush (Brush)</option>
                    <option value="Pacifico">Pacifico (Fun)</option>
                  </optgroup>
                </select>
              </div>

              {/* Text size */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Ukuran Font Utama (Baris 2)</span>
                  <span>{watermarkSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="48" 
                  step="1"
                  value={watermarkSize} 
                  onChange={(e) => setWatermarkSize(parseInt(e.target.value))} 
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}

          {/* No overlays indicator */}
          {watermarkType === 'none' && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px dashed var(--border-color)', 
              borderRadius: '8px', 
              padding: '12px', 
              fontSize: '0.7rem', 
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.4
            }}>
              ✨ Semua layer overlay dinonaktifkan. Foto akan diekspor bersih tanpa bingkai atau watermark teks.
            </div>
          )}

          {/* Watermark opacity */}
          {watermarkType !== 'none' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>Opasitas Layer Terpilih</span>
                <span>{Math.round(watermarkOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05"
                value={watermarkOpacity} 
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))} 
                style={{ accentColor: 'var(--secondary)', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>

        {/* AI Advanced Feature Toggles */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} className="text-gradient" /> Filter Peningkatan AI
          </h3>

          {/* Face smoothing */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Kecantikan Wajah</span>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Memuluskan warna kulit secara otomatis</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isFacialSmoothingEnabled} 
                onChange={(e) => setIsFacialSmoothingEnabled(e.target.checked)} 
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Vehicle Privacy protection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filter Privasi Kendaraan</span>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Menyamarkan plat nomor kendaraan</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isPlateBlurringEnabled} 
                onChange={(e) => setIsPlateBlurringEnabled(e.target.checked)} 
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Blurry Auto-filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Auto-Filter Foto Buram</span>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mengeliminasi jepretan buram yang tidak fokus</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isBlurryFilterEnabled} 
                onChange={(e) => setIsBlurryFilterEnabled(e.target.checked)} 
              />
              <span className="switch-slider" />
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertCircle size={14} className="text-gradient-cyan" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Parameter peningkatan tertanam langsung ke dalam ekspor kanvas. Menyesuaikan slider akan langsung memperbarui profil metadata aktif.
          </p>
        </div>

      </div>
    </div>
  );
};
