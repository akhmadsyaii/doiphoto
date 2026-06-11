import React, { useState, useRef, useEffect } from 'react';
import { useCloud } from '../context/CloudContext';
import { applyAIRetouch } from '../utils/AIRetoucher';
import { Sliders, Sparkles, AlertCircle, RefreshCw, Layers, Type, Shield, Upload, Trash2, SlidersHorizontal } from 'lucide-react';
import { parseLightroomPreset } from '../utils/presetParser';

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
const PREVIEW_SAMPLE = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop';

export const RetouchProfilesView: React.FC = () => {
  const { 
    activePreset, 
    setActivePreset, 
    isAutoRetouchEnabled, 
    setIsAutoRetouchEnabled,
    watermarkText,
    setWatermarkText,
    watermarkOpacity,
    setWatermarkOpacity,
    watermarkSize,
    setWatermarkSize,
    watermarkType,
    setWatermarkType,
    watermarkImage,
    setWatermarkImage,
    watermarkFont,
    setWatermarkFont,
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

  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
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
          font: watermarkFont
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', flex: 1, minHeight: 0 }}>
      
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

        {/* Live Slider Canvas */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className="slider-container"
          style={{ flex: 1, cursor: 'ew-resize', position: 'relative', background: '#0a0a0c' }}
        >
          {/* Before */}
          <div className="slider-image-before">
            <img src={originalUrl} alt="Original unretouched shot" style={{ pointerEvents: 'none' }} />
            <span style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              FOTO ASLI KAMERA
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
            <span style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 10, background: 'var(--primary-grad)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
              HASIL RETOUCH AI
            </span>
          </div>

          {/* Divider */}
          <div className="slider-bar" style={{ left: `${sliderPos}%` }}>
            <div className="slider-handle">
              <Sparkles size={16} />
            </div>
          </div>

          {/* Spinner */}
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <RefreshCw className="upload-active" size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span style={{ fontSize: '0.85rem' }}>Retouch AI...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI preset list, watermarks, face beautification controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '380px', flexShrink: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 100px)', paddingRight: '4px' }}>
        
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
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Type size={16} className="text-gradient-cyan" /> Pengaturan Watermark Event
          </h3>

          {/* Watermark Layer Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Layer Aktif</label>
            
            {/* Bingkai Switch */}
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
              <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 500 }}>🖼️ Bingkai Overlay (PNG)</span>
              <input 
                type="checkbox" 
                checked={watermarkType === 'image' || watermarkType === 'both'} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    setWatermarkType(watermarkType === 'text' || watermarkType === 'both' ? 'both' : 'image');
                  } else {
                    setWatermarkType(watermarkType === 'text' || watermarkType === 'both' ? 'text' : 'none');
                  }
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </label>

            {/* Teks Switch */}
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
              <span style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 500 }}>✍️ Watermark Teks</span>
              <input 
                type="checkbox" 
                checked={watermarkType === 'text' || watermarkType === 'both'} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    setWatermarkType(watermarkType === 'image' || watermarkType === 'both' ? 'both' : 'text');
                  } else {
                    setWatermarkType(watermarkType === 'image' || watermarkType === 'both' ? 'image' : 'none');
                  }
                }}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Section: Bingkai Upload */}
          {(watermarkType === 'image' || watermarkType === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>File Bingkai (PNG Transparan disarankan)</label>
              
              {watermarkImage ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ 
                    height: '100px', 
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
                    height: '80px',
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
                          setWatermarkImage(event.target?.result as string);
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

          {/* Section: Text Customizer */}
          {(watermarkType === 'text' || watermarkType === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              
              {/* Text input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Teks Label Watermark</label>
                <input 
                  type="text" 
                  value={watermarkText} 
                  onChange={(e) => setWatermarkText(e.target.value)} 
                  className="glass-input" 
                  style={{ fontSize: '0.8rem', padding: '8px' }} 
                  placeholder="Ketik teks watermark..."
                />
              </div>

              {/* Font selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pilihan Font</label>
                <select
                  value={watermarkFont}
                  onChange={(e) => setWatermarkFont(e.target.value)}
                  className="glass-input"
                  style={{ fontSize: '0.8rem', padding: '8px', cursor: 'pointer', fontFamily: watermarkFont }}
                >
                  {/* Modern Sans-Serif */}
                  <optgroup label="Modern Sans-Serif" style={{ fontFamily: 'sans-serif' }}>
                    <option value="Outfit" style={{ fontFamily: 'Outfit' }}>Outfit</option>
                    <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter</option>
                    <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                  </optgroup>
                  {/* Elegant Serif */}
                  <optgroup label="Elegant Serif" style={{ fontFamily: 'serif' }}>
                    <option value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
                    <option value="Cinzel" style={{ fontFamily: 'Cinzel' }}>Cinzel</option>
                  </optgroup>
                  {/* Elegant Cursive / Calligraphy */}
                  <optgroup label="Calligraphy & Script" style={{ fontFamily: 'cursive' }}>
                    <option value="Sacramento" style={{ fontFamily: 'Sacramento' }}>Sacramento (Script)</option>
                    <option value="Great Vibes" style={{ fontFamily: 'Great Vibes' }}>Great Vibes (Calligraphy)</option>
                    <option value="Alex Brush" style={{ fontFamily: 'Alex Brush' }}>Alex Brush (Brush)</option>
                    <option value="Pacifico" style={{ fontFamily: 'Pacifico' }}>Pacifico (Fun)</option>
                  </optgroup>
                </select>
              </div>

              {/* Text size */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Ukuran Font (PX)</span>
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
