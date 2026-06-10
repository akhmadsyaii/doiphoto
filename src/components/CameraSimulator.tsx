import React, { useState, useRef } from 'react';
import { useCloud } from '../context/CloudContext';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Star, 
  Radio, 
  Send, 
  Trash2 
} from 'lucide-react';

const SIMULATED_SHOT_IMAGES = [
  'https://images.unsplash.com/photo-1519225495810-7517c296517a?q=80&w=800&auto=format&fit=crop', // bridal portrait
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=800&auto=format&fit=crop', // wedding rings
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop', // nature lights
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop', // stage conference
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800&auto=format&fit=crop', // festival concert
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop'  // sports running
];

interface SDCardPhoto {
  id: string;
  name: string;
  url: string;
  isStarred: boolean;
  category: 'Akad' | 'Resepsi' | 'Photobooth';
  metadata: {
    aperture: string;
    shutterSpeed: string;
    iso: string;
    focalLength: string;
    cameraBrand: string;
    cameraModel: string;
  };
}

export const CameraSimulator: React.FC = () => {
  const { 
    cameraInfo, 
    connectCamera, 
    setCameraStatus, 
    addPhoto,
    uploadMode,
    setUploadMode
  } = useCloud();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dials
  const [aperture, setAperture] = useState<string>('f/1.8');
  const [shutterSpeed, setShutterSpeed] = useState<string>('1/250s');
  const [iso, setIso] = useState<string>('200');
  const [cameraBrand, setCameraBrand] = useState<'Sony' | 'Canon' | 'Nikon'>('Sony');
  const [shutterCount, setShutterCount] = useState<number>(3119);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  // Advanced Simulator States
  const [selectedCategory, setSelectedCategory] = useState<'Akad' | 'Resepsi' | 'Photobooth'>('Akad');
  const [isStarredDialOn, setIsStarredDialOn] = useState<boolean>(false);
  const [sdCardPhotos, setSdCardPhotos] = useState<SDCardPhoto[]>([]);

  // Synthesize camera click audio
  const playShutterClick = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
      const bufferSize = audioCtx.sampleRate * 0.1;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1300, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.08);
      filter.Q.setValueAtTime(4, audioCtx.currentTime);
      
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.45, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.095);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  const uploadPhotoToCloud = async (
    url: string, 
    name: string, 
    metadata: SDCardPhoto['metadata'], 
    options: { category: SDCardPhoto['category']; isStarred: boolean }
  ) => {
    setCameraStatus('Transferring');
    await addPhoto(url, name, metadata, options);
    setCameraStatus('Idle');
  };

  const handleCapture = async () => {
    if (!cameraInfo) {
      connectCamera({
        brand: cameraBrand,
        model: cameraBrand === 'Sony' ? 'Alpha 7 IV (Virtual)' : cameraBrand === 'Canon' ? 'EOS R6 (Virtual)' : 'Z6 II (Virtual)',
        battery: 85,
        connectionType: 'Simulator',
        status: 'Idle'
      });
    }

    setFlashActive(true);
    playShutterClick();
    setTimeout(() => setFlashActive(false), 280);

    setCameraStatus('Capturing');
    const newShutter = shutterCount + 1;
    setShutterCount(newShutter);

    const selectedUrl = SIMULATED_SHOT_IMAGES[currentImageIndex];
    setCurrentImageIndex((prev) => (prev + 1) % SIMULATED_SHOT_IMAGES.length);

    const name = `${cameraBrand === 'Sony' ? 'DSC' : cameraBrand === 'Canon' ? 'IMG' : 'DSC'}_${newShutter}.JPG`;
    const metadata = {
      aperture,
      shutterSpeed,
      iso,
      focalLength: '85mm',
      cameraBrand,
      cameraModel: cameraBrand === 'Sony' ? 'ILCE-7M4' : cameraBrand === 'Canon' ? 'EOS R6' : 'Z6 II'
    };

    // Routing based on Upload Mode
    if (uploadMode === 'auto') {
      await uploadPhotoToCloud(selectedUrl, name, metadata, { category: selectedCategory, isStarred: isStarredDialOn });
    } 
    
    else if (uploadMode === 'starred') {
      if (isStarredDialOn) {
        await uploadPhotoToCloud(selectedUrl, name, metadata, { category: selectedCategory, isStarred: true });
      } else {
        // Starred Mode + Unstarred photo: Save to camera SD Card roll
        const localPhoto: SDCardPhoto = {
          id: `local-${Date.now()}`,
          name,
          url: selectedUrl,
          isStarred: false,
          category: selectedCategory,
          metadata
        };
        setSdCardPhotos(prev => [...prev, localPhoto]);
        setCameraStatus('Idle');
      }
    } 
    
    else if (uploadMode === 'manual') {
      // Manual Mode: Always save to local SD Card roll
      const localPhoto: SDCardPhoto = {
        id: `local-${Date.now()}`,
        name,
        url: selectedUrl,
        isStarred: isStarredDialOn,
        category: selectedCategory,
        metadata
      };
      setSdCardPhotos(prev => [...prev, localPhoto]);
      setCameraStatus('Idle');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      if (!cameraInfo) {
        connectCamera({
          brand: cameraBrand,
          model: cameraBrand === 'Sony' ? 'Alpha 7 IV (Virtual)' : cameraBrand === 'Canon' ? 'EOS R6 (Virtual)' : 'Z6 II (Virtual)',
          battery: 85,
          connectionType: 'Simulator',
          status: 'Idle'
        });
      }

      setFlashActive(true);
      playShutterClick();
      setTimeout(() => setFlashActive(false), 280);

      setCameraStatus('Capturing');
      const newShutter = shutterCount + 1;
      setShutterCount(newShutter);

      const metadata = {
        aperture,
        shutterSpeed,
        iso,
        focalLength: '50mm',
        cameraBrand,
        cameraModel: cameraBrand === 'Sony' ? 'ILCE-7M4' : cameraBrand === 'Canon' ? 'EOS R6' : 'Z6 II'
      };

      if (uploadMode === 'auto') {
        await uploadPhotoToCloud(dataUrl, file.name, metadata, { category: selectedCategory, isStarred: isStarredDialOn });
      } else if (uploadMode === 'starred' && isStarredDialOn) {
        await uploadPhotoToCloud(dataUrl, file.name, metadata, { category: selectedCategory, isStarred: true });
      } else {
        // Stored on local roll
        const localPhoto: SDCardPhoto = {
          id: `local-${Date.now()}`,
          name: file.name,
          url: dataUrl,
          isStarred: isStarredDialOn,
          category: selectedCategory,
          metadata
        };
        setSdCardPhotos(prev => [...prev, localPhoto]);
        setCameraStatus('Idle');
      }
    };
    reader.readAsDataURL(file);
  };

  // Triggered when guest stars or manually uploads a photo from SD card roll
  const handleStarSDPhoto = async (localPhoto: SDCardPhoto) => {
    // Toggles star
    const updatedStarred = !localPhoto.isStarred;
    
    // Update local state
    setSdCardPhotos(prev => 
      prev.map(p => p.id === localPhoto.id ? { ...p, isStarred: updatedStarred } : p)
    );

    // If Starred Mode is active, toggling it ON triggers auto-upload!
    if (uploadMode === 'starred' && updatedStarred) {
      // Remove from SD Card roll and upload
      setSdCardPhotos(prev => prev.filter(p => p.id !== localPhoto.id));
      await uploadPhotoToCloud(localPhoto.url, localPhoto.name, localPhoto.metadata, { 
        category: localPhoto.category, 
        isStarred: true 
      });
    }
  };

  const handleUploadSDPhoto = async (localPhoto: SDCardPhoto) => {
    // Remove from SD Card roll and upload
    setSdCardPhotos(prev => prev.filter(p => p.id !== localPhoto.id));
    await uploadPhotoToCloud(localPhoto.url, localPhoto.name, localPhoto.metadata, { 
      category: localPhoto.category, 
      isStarred: localPhoto.isStarred 
    });
  };

  const handleDeleteSDPhoto = (id: string) => {
    setSdCardPhotos(prev => prev.filter(p => p.id !== id));
  };

  const selectBrand = (brand: 'Sony' | 'Canon' | 'Nikon') => {
    setCameraBrand(brand);
    if (cameraInfo && cameraInfo.connectionType === 'Simulator') {
      connectCamera({
        ...cameraInfo,
        brand,
        model: brand === 'Sony' ? 'Alpha 7 IV (Virtual)' : brand === 'Canon' ? 'EOS R6 (Virtual)' : 'Z6 II (Virtual)'
      });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Flash overlay */}
      <div className={`shutter-flash-overlay ${flashActive ? 'shutter-flash-active' : ''}`} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Camera size={20} className="text-gradient" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem' }}>Simulator Kamera DSLR</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Simulasi interaksi kamera, penyimpanan SD Card, & dial pencahayaan multi-brand
          </p>
        </div>
      </div>

      {/* Upload mode dial */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
          Pengaturan Mode Upload
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['auto', 'starred', 'manual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setUploadMode(m)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.7rem',
                border: 'none',
                background: uploadMode === m ? 'var(--primary-grad)' : 'transparent',
                color: uploadMode === m ? '#fff' : 'var(--text-muted)',
                boxShadow: uploadMode === m ? '0 2px 6px var(--primary-glow)' : 'none'
              }}
            >
              {m === 'auto' ? 'OTOMATIS' : m === 'starred' ? 'BINTANG' : 'MANUAL'}
            </button>
          ))}
        </div>
      </div>

      {/* Category routing & star dial settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
        
        {/* Category routing selector */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Kategori Aktif
          </label>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            {(['Akad', 'Resepsi', 'Photobooth'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: '0.65rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: selectedCategory === c ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: selectedCategory === c ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {c === 'Photobooth' ? 'Booth' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Shutter star toggle dial */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', textAlign: 'center' }}>
            Bintang / Kunci
          </label>
          <button
            onClick={() => setIsStarredDialOn(!isStarredDialOn)}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '4px 0',
              height: '28px',
              border: '1px solid var(--border-color)',
              color: isStarredDialOn ? 'var(--accent-amber)' : 'var(--text-muted)',
              background: isStarredDialOn ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
            }}
          >
            <Star size={14} fill={isStarredDialOn ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Simulator Device Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Merek</label>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            {(['Sony', 'Canon', 'Nikon'] as const).map((b) => (
              <button
                key={b}
                onClick={() => selectBrand(b)}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: '0.65rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: cameraBrand === b ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: cameraBrand === b ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Jumlah Jepretan</label>
          <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>
            {shutterCount}
          </div>
        </div>
      </div>

      {/* Viewfinder Preview */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '170px', 
        borderRadius: '12px', 
        background: '#040406',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Viewfinder grids */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.3%', width: '1px', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.6%', width: '1px', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '33.3%', height: '1px', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '66.6%', height: '1px', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        
        {/* Central autofocus bracket */}
        <div style={{ 
          border: '1px solid rgba(255,255,255,0.25)', 
          width: '50px', 
          height: '35px', 
          position: 'relative',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: cameraInfo?.status === 'Capturing' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }} />
        </div>

        {/* Viewfinder Text Overlays */}
        <div style={{ position: 'absolute', bottom: '8px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#777', fontFamily: 'monospace' }}>
          <span>F{aperture.replace('f/', '')}</span>
          <span>{shutterSpeed}</span>
          <span>ISO {iso}</span>
          <span style={{ color: cameraInfo?.status === 'Transferring' ? 'var(--secondary)' : '#777' }}>
            {cameraInfo?.status === 'Idle' ? 'SIAGA' : cameraInfo?.status === 'Capturing' ? 'MEMOTRET' : cameraInfo?.status === 'Transferring' ? 'TRANSFER...' : 'SIAGA'}
          </span>
        </div>

        {/* Viewfinder background image */}
        <img 
          src={SIMULATED_SHOT_IMAGES[currentImageIndex]} 
          alt="Viewfinder target" 
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.15,
            pointerEvents: 'none',
            filter: 'blur(1px)'
          }}
        />
      </div>

      {/* Manual Exposure Dials */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Aperture</label>
          <select value={aperture} onChange={(e) => setAperture(e.target.value)} className="glass-input" style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}>
            <option value="f/1.4">f/1.4</option>
            <option value="f/1.8">f/1.8</option>
            <option value="f/2.8">f/2.8</option>
            <option value="f/4.0">f/4.0</option>
            <option value="f/5.6">f/5.6</option>
            <option value="f/8.0">f/8.0</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Shutter</label>
          <select value={shutterSpeed} onChange={(e) => setShutterSpeed(e.target.value)} className="glass-input" style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}>
            <option value="1/1000s">1/1000s</option>
            <option value="1/500s">1/500s</option>
            <option value="1/250s">1/250s</option>
            <option value="1/100s">1/100s</option>
            <option value="1/30s">1/30s</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ISO</label>
          <select value={iso} onChange={(e) => setIso(e.target.value)} className="glass-input" style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="400">400</option>
            <option value="800">800</option>
            <option value="1600">1600</option>
          </select>
        </div>
      </div>

      {/* Simulator Trigger Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleCapture}
          className="btn btn-primary"
          style={{ 
            flex: 2, 
            height: '42px',
            borderRadius: '21px',
            fontSize: '0.9rem',
            boxShadow: '0 4px 15px rgba(217, 70, 239, 0.4)'
          }}
        >
          <Sparkles size={14} />
          Tekan Shutter
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary"
          style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0 }}
          title="Upload File Gambar Kustom"
        >
          <Upload size={16} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
      </div>

      {/* Local Camera Roll / SD Card Queue (Starred & Manual modes queue) */}
      {sdCardPhotos.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={12} style={{ color: 'var(--accent-amber)' }} className="upload-active" /> 
              Penyimpanan Kamera (SD Card) ({sdCardPhotos.length})
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {sdCardPhotos.map((photo) => (
              <div 
                key={photo.id}
                style={{
                  width: '74px',
                  height: '92px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--bg-deep)',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Thumbnail image */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <img src={photo.url} alt="SD Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {/* Category overlay label */}
                  <span style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px', color: '#ddd' }}>
                    {photo.category === 'Photobooth' ? 'Booth' : photo.category}
                  </span>
                </div>

                {/* Control bar */}
                <div style={{ display: 'flex', height: '24px', background: 'rgba(0,0,0,0.7)', borderTop: '1px solid var(--border-color)' }}>
                  
                  {/* Star local photo */}
                  <button
                    onClick={() => handleStarSDPhoto(photo)}
                    style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: photo.isStarred ? 'var(--accent-amber)' : '#999' }}
                    title={photo.isStarred ? 'Berbintang' : 'Beri bintang'}
                  >
                    <Star size={10} fill={photo.isStarred ? 'currentColor' : 'none'} />
                  </button>

                  {/* Manual upload to cloud */}
                  {uploadMode === 'manual' && (
                    <button
                      onClick={() => handleUploadSDPhoto(photo)}
                      style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}
                      title="Upload ke cloud"
                    >
                      <Send size={9} />
                    </button>
                  )}

                  {/* Delete from SD card */}
                  <button
                    onClick={() => handleDeleteSDPhoto(photo.id)}
                    style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-rose)', borderLeft: uploadMode !== 'manual' ? '1px solid var(--border-color)' : 'none' }}
                    title="Hapus foto lokal"
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
