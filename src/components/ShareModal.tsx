import React, { useEffect, useRef, useState } from 'react';
import { useCloud } from '../context/CloudContext';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, Users, ArrowUpRight, Share2 } from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { eventName, gdriveLink, qrTargetMode, setQrTargetMode, activeAlbumId } = useCloud();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeGuests, setActiveGuests] = useState(18);
  const [totalDownloads, setTotalDownloads] = useState(42);

  // Fluctuating guest counter simulation to make the UI feel alive
  useEffect(() => {
    if (!isOpen) return;

    const guestInterval = setInterval(() => {
      setActiveGuests(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const nextVal = prev + change;
        return Math.max(8, Math.min(32, nextVal));
      });
    }, 4000);

    const downloadInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        setTotalDownloads(prev => prev + 1);
      }
    }, 8000);

    return () => {
      clearInterval(guestInterval);
      clearInterval(downloadInterval);
    };
  }, [isOpen]);
  
  // Create a shareable URL that shifts the view directly to the guest gallery
  const guestUrl = `${window.location.origin}?view=gallery&albumId=${activeAlbumId || ''}`;
  const shareUrl = qrTargetMode === 'gdrive' && gdriveLink ? gdriveLink : guestUrl;

  // Automatically reset to gallery mode if gdriveLink is cleared
  useEffect(() => {
    if (!gdriveLink && qrTargetMode === 'gdrive') {
      setQrTargetMode('gallery');
    }
  }, [gdriveLink, qrTargetMode, setQrTargetMode]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#1e1b4b', // Deep indigo
            light: '#ffffff' // White background
          }
        },
        (error) => {
          if (error) console.error('Failed to generate QR code canvas:', error);
        }
      );
    }
  }, [isOpen, shareUrl]);

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = `${eventName.replace(/\s+/g, '_')}_QR_Code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 5, 7, 0.85)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(12px)'
    }} onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{
          width: '460px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Share2 size={20} className="text-gradient" />
          <h3 style={{ fontSize: '1.25rem' }}>Bagikan Album Live</h3>
        </div>

        {/* Destination Toggle Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Tujuan Link & QR Code
          </label>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setQrTargetMode('gallery')}
              className="btn"
              style={{
                flex: 1,
                fontSize: '0.75rem',
                padding: '8px',
                border: 'none',
                background: qrTargetMode === 'gallery' ? 'var(--primary-grad)' : 'transparent',
                color: qrTargetMode === 'gallery' ? '#fff' : 'var(--text-secondary)',
                boxShadow: qrTargetMode === 'gallery' ? '0 2px 8px var(--primary-glow)' : 'none'
              }}
            >
              Galeri do'ipicture
            </button>
            <button
              onClick={() => gdriveLink && setQrTargetMode('gdrive')}
              disabled={!gdriveLink}
              className="btn"
              style={{
                flex: 1,
                fontSize: '0.75rem',
                padding: '8px',
                border: 'none',
                background: qrTargetMode === 'gdrive' ? 'var(--secondary-grad)' : 'transparent',
                color: qrTargetMode === 'gdrive' ? '#fff' : 'var(--text-muted)',
                opacity: gdriveLink ? 1 : 0.5,
                cursor: gdriveLink ? 'pointer' : 'not-allowed',
                boxShadow: qrTargetMode === 'gdrive' ? '0 2px 8px var(--secondary-glow)' : 'none'
              }}
              title={!gdriveLink ? "Silakan konfigurasi link Google Drive di dashboard terlebih dahulu" : ""}
            >
              Folder Google Drive
            </button>
          </div>
          {!gdriveLink && (
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', marginTop: '2px' }}>
              ⚠️ Google Drive belum dikonfigurasi. Tambahkan link di pengaturan dashboard untuk mengaktifkan redirect langsung.
            </span>
          )}
        </div>

        {/* QR Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          borderRadius: '12px'
        }}>
          <div style={{ 
            background: '#ffffff', 
            padding: '10px', 
            borderRadius: '12px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex'
          }}>
            <canvas ref={canvasRef} />
          </div>
          
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
            {qrTargetMode === 'gdrive' 
              ? 'Tamu men-scan QR code ini untuk mengakses folder bersama Google Drive Anda secara langsung.' 
              : 'Tamu men-scan QR code ini di ponsel mereka untuk melihat galeri live yang di-upload secara instan.'}
          </span>
          
          <button 
            onClick={handleDownloadQR} 
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            <Download size={14} /> Download Gambar QR
          </button>
        </div>

        {/* URL Sharing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Link Akses Galeri
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              readOnly 
              value={shareUrl}
              className="glass-input" 
              style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis' }}
            />
            <button 
              onClick={handleCopyLink} 
              className="btn btn-primary"
              style={{ padding: '0 16px', minWidth: '100px' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>{copied ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        {/* Live Guest Analytics (Simulated) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px', 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '16px' 
        }}>
          <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={16} className="text-gradient-cyan" />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tamu Terhubung</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{activeGuests} Aktif</div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowUpRight size={16} className="text-gradient" />
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Foto Di-download</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{totalDownloads} Total</div>
            </div>
          </div>
        </div>

        {/* Local Network Info */}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <strong>Tips:</strong> Untuk mengakses ini dari ponsel Anda dalam jaringan Wi-Fi yang sama, jalankan server dev dengan IP lokal Anda (contoh: <code>npm run dev -- --host</code>).
        </div>
      </div>
    </div>
  );
};
