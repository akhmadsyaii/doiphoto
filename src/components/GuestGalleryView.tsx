import React, { useState } from 'react';
import { useCloud, type Photo } from '../context/CloudContext';
import {
  Download,
  Share2,
  ImageIcon,
  Info,
  Eye,
  X,
  Camera,
  Folder,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Star,
  ExternalLink
} from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';

export const GuestGalleryView: React.FC = () => {
  const { eventName, photos, viewingPhoto, setViewingPhoto, gdriveLink } = useCloud();
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Advanced features state
  const [selectedCat, setSelectedCat] = useState<'All' | 'Akad' | 'Resepsi' | 'Photobooth'>('All');
  
  // AI Face Matching States
  const [isFaceSearchOpen, setIsFaceSearchOpen] = useState<boolean>(false);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [scanStatus, setScanStatus] = useState<string>('Upload selfie untuk memulai pemindaian...');
  const [faceFilterActive, setFaceFilterActive] = useState<boolean>(false);

  // Filter photos based on category + face search matching
  const getFilteredPhotos = () => {
    let list = photos.filter(p => p.isApproved && p.status === 'done');
    
    // Category filter
    if (selectedCat !== 'All') {
      list = list.filter(p => p.category === selectedCat);
    }

    // AI Face search filter (simulated face ID 1 matching guest selfie)
    if (faceFilterActive) {
      list = list.filter(p => p.faceIds.includes(1));
    }

    return list;
  };

  const filteredPhotos = getFilteredPhotos();

  // Staggered download of filtered photos
  const handleDownloadAll = () => {
    if (filteredPhotos.length === 0) return;
    
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);

    filteredPhotos.forEach((photo, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = photo.url;
        link.download = photo.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
  };

  const handleCopyGalleryLink = async () => {
    try {
      await copyToClipboard(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadSingle = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulated AI Face match routine
  const triggerFaceMatchScan = () => {
    setScanStep('scanning');
    
    const steps = [
      { text: 'Menginisialisasi matriks kamera...', delay: 600 },
      { text: 'Mendeteksi kontur & fitur wajah...', delay: 1300 },
      { text: 'Mengekstrak sidik wajah biometrik 128-D...', delay: 2000 },
      { text: 'Mencocokkan tanda tangan dengan database event...', delay: 2700 },
      { text: 'Pencocokan selesai! Face ID #001 terisolasi.', delay: 3300 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setScanStatus(step.text);
      }, step.delay);
    });

    setTimeout(() => {
      setScanStep('done');
      setFaceFilterActive(true);
      setIsFaceSearchOpen(false);
    }, 3600);
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelfieFile(event.target?.result as string);
      setScanStatus('Selfie berhasil dimuat. Siap dianalisis.');
    };
    reader.readAsDataURL(file);
  };

  const clearFaceSearch = () => {
    setSelfieFile(null);
    setScanStep('idle');
    setScanStatus('Upload selfie untuk memulai pemindaian...');
    setFaceFilterActive(false);
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px',
      width: '100%'
    }}>
      
      {/* Styles for biometric scan laser */}
      <style>{`
        @keyframes scan-laser {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        @keyframes scan-grid {
          0% { opacity: 0.15; }
          50% { opacity: 0.4; }
          100% { opacity: 0.15; }
        }
        .biometric-laser-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: #10b981;
          box-shadow: 0 0 8px #10b981, 0 0 16px #10b981;
          animation: scan-laser 2s linear infinite;
          z-index: 10;
        }
        .biometric-grid-overlay {
          position: absolute;
          inset: 0;
          background-size: 15px 15px;
          background-image: linear-gradient(to right, rgba(16,185,129,0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(16,185,129,0.08) 1px, transparent 1px);
          animation: scan-grid 3s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Banner */}
      <div className="glass-panel" style={{ 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Pulsing indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '10px', 
            height: '10px', 
            background: 'var(--accent-emerald)', 
            borderRadius: '50%', 
            boxShadow: '0 0 10px var(--accent-emerald)'
          }} className="upload-active" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Feed Event Live Aktif
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: '6px' }}>
            {eventName}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Selamat datang! Lihat dan download foto yang diambil oleh fotografer secara real-time.
          </p>
        </div>

        {/* Action button row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {gdriveLink && (
            <a 
              href={gdriveLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-accent"
              style={{ 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)'
              }}
            >
              <ExternalLink size={16} />
              <span>Buka Album Google Drive</span>
            </a>
          )}

          <button 
            onClick={handleDownloadAll} 
            className="btn btn-primary"
            disabled={filteredPhotos.length === 0}
            style={{ opacity: filteredPhotos.length === 0 ? 0.5 : 1 }}
          >
            <Download size={16} />
            Download Kategori ({filteredPhotos.length})
          </button>
          
          <button 
            onClick={() => setIsFaceSearchOpen(true)} 
            className="btn btn-accent"
          >
            <Search size={16} />
            Cari Wajah Saya
          </button>

          <button onClick={handleCopyGalleryLink} className="btn btn-secondary">
            <Share2 size={16} />
            {copiedLink ? 'Link Disalin!' : 'Bagikan Galeri'}
          </button>
        </div>

        {/* Warning alerts */}
        {downloadSuccess && (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            padding: '10px 16px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--accent-emerald)',
            maxWidth: '500px'
          }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Men-download foto secara berurutan. Silakan klik "Izinkan" (Allow) jika browser Anda meminta izin untuk men-download beberapa file.</span>
          </div>
        )}
      </div>

      {/* Guest category tabs navigator */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px' }}>
        {(['All', 'Akad', 'Resepsi', 'Photobooth'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            style={{
              background: selectedCat === cat ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: 'none',
              borderBottom: selectedCat === cat ? '3px solid var(--primary)' : '3px solid transparent',
              color: selectedCat === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Folder size={14} style={{ opacity: 0.6 }} />
            {cat === 'All' ? 'Semua' : cat}
          </button>
        ))}
      </div>

      {/* Active filters status banner */}
      {faceFilterActive && (
        <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={16} />
            <span>Pencocokan Wajah AI Aktif: Menampilkan foto yang berisi profil wajah Anda (#001)</span>
          </div>
          <button 
            onClick={clearFaceSearch} 
            className="btn btn-secondary" 
            style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.7rem' }}
          >
            Hapus Pencarian Wajah
          </button>
        </div>
      )}

      {/* Masonry Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
          <ImageIcon size={64} strokeWidth={1} />
          <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Tidak ada foto yang cocok dengan filter Anda.</p>
          <p style={{ fontSize: '0.75rem', textAlign: 'center', maxWidth: '300px' }}>
            Coba pilih kategori yang berbeda atau hapus filter pencarian wajah jika sedang aktif.
          </p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className="masonry-item" 
              onClick={() => setViewingPhoto(photo)}
              style={{ cursor: 'pointer' }}
            >
              <img src={photo.url} alt={photo.name} loading="lazy" />
              
              {/* Star overlay indicator */}
              {photo.isStarred && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5 }}>
                  <span className="badge badge-amber" style={{ padding: '3px' }}><Star size={10} fill="currentColor" /></span>
                </div>
              )}

              {/* Category label */}
              <span className="badge badge-cyan" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5, fontSize: '0.55rem' }}>
                {photo.category}
              </span>

              {/* Hover Overlay */}
              <div className="masonry-item-overlay">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ color: 'white' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {photo.name}
                    </p>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      #{photo.shutterCount}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setViewingPhoto(photo); }}
                      className="btn btn-secondary" 
                      style={{ padding: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownloadSingle(photo); }}
                      className="btn btn-secondary" 
                      style={{ padding: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Face search dialog modal */}
      {isFaceSearchOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 7, 0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)'
        }} onClick={() => setIsFaceSearchOpen(false)}>
          <div 
            className="glass-panel" 
            style={{
              width: '400px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsFaceSearchOpen(false)} 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} className="text-gradient" />
              <h3 style={{ fontSize: '1.15rem' }}>Pencarian Pencocokan Wajah AI</h3>
            </div>

            {/* Selfie photo area */}
            <div style={{ 
              height: '220px', 
              borderRadius: '10px', 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-color)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {selfieFile ? (
                <>
                  <img src={selfieFile} alt="Selfie upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {/* Biometric overlay scanning grids */}
                  {scanStep === 'scanning' && (
                    <>
                      <div className="biometric-laser-line" />
                      <div className="biometric-grid-overlay" />
                    </>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Camera size={38} strokeWidth={1} />
                  <span style={{ fontSize: '0.75rem' }}>Letakkan file gambar selfie Anda di sini</span>
                  <button 
                    onClick={() => document.getElementById('selfie-uploader')?.click()}
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                  >
                    Pilih File
                  </button>
                  <input 
                    type="file" 
                    id="selfie-uploader" 
                    onChange={handleSelfieUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
              )}
            </div>

            {/* Scan Status Log display */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                Log Status
              </span>
              <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: scanStep === 'scanning' ? 'var(--secondary)' : 'var(--text-primary)' }}>
                {scanStep === 'scanning' && <RefreshCw size={10} className="upload-active" style={{ display: 'inline-block', marginRight: '4px', animation: 'spin 1.5s linear infinite' }} />}
                {scanStatus}
              </p>
            </div>

            {/* Modal action buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                onClick={triggerFaceMatchScan} 
                disabled={!selfieFile || scanStep === 'scanning'}
                className="btn btn-primary"
                style={{ flex: 1, opacity: (!selfieFile || scanStep === 'scanning') ? 0.5 : 1 }}
              >
                Pindai & Cari
              </button>
              
              <button 
                onClick={() => { setSelfieFile(null); setScanStep('idle'); setScanStatus('Upload selfie untuk memulai pemindaian...'); }} 
                disabled={!selfieFile || scanStep === 'scanning'}
                className="btn btn-secondary"
                style={{ opacity: (!selfieFile || scanStep === 'scanning') ? 0.5 : 1 }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Viewer */}
      {viewingPhoto && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(5,5,7,0.97)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }} onClick={() => setViewingPhoto(null)}>
          
          <div style={{ 
            position: 'relative', 
            maxWidth: '95vw', 
            maxHeight: '90vh', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px' 
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ 
              position: 'relative', 
              background: '#040406', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--border-color)'
            }}>
              <img 
                src={viewingPhoto.url} 
                alt={viewingPhoto.name} 
                style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', objectFit: 'contain' }} 
              />
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>{viewingPhoto.name}</h4>
                  <span className="badge badge-cyan" style={{ fontSize: '0.55rem' }}>{viewingPhoto.category}</span>
                  {viewingPhoto.isStarred && <span className="badge badge-amber" style={{ padding: '2px 5px', fontSize: '0.55rem' }}><Star size={8} fill="currentColor" /> Bintang</span>}
                </div>
                
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  <span>Jepretan: #{viewingPhoto.shutterCount}</span>
                  <span>Waktu: {new Date(viewingPhoto.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDownloadSingle(viewingPhoto)} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                  <Download size={14} /> Download
                </button>
                <button onClick={() => setViewingPhoto(null)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                  <X size={14} /> Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
