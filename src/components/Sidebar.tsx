import React from 'react';
import { useCloud } from '../context/CloudContext';
import { Camera, Sliders, Image, Wifi, WifiOff, RefreshCw, LogOut, ArrowLeft, Sun, Moon } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    eventName, 
    photos, 
    cameraInfo,
    activePreset,
    logout,
    selectAlbum,
    theme,
    toggleTheme
  } = useCloud();

  const menuItems = [
    { id: 'dashboard', label: 'Workstation Foto', icon: Camera },
    { id: 'retouch', label: 'Profil Retouch AI', icon: Sliders },
    { id: 'gallery', label: 'Galeri Live Tamu', icon: Image },
  ] as const;

  return (
    <aside className="glass-panel" style={{ width: '280px', margin: '20px 0 20px 20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0 }}>
      {/* Back to Albums Button */}
      <button
        onClick={() => selectAlbum(null)}
        className="btn btn-secondary"
        style={{
          justifyContent: 'flex-start',
          padding: '8px 12px',
          fontSize: '0.75rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <ArrowLeft size={14} />
        <span>Daftar Album</span>
      </button>

      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: 'var(--primary-grad)', 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px var(--primary-glow)'
        }}>
          <Camera size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            do'i<span className="text-gradient">picture</span>
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Camera-To-Cloud
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'gallery') {
                  const activeId = localStorage.getItem('doiphoto_active_album_id') || 'album-demo';
                  const url = `${window.location.origin}?view=gallery&albumId=${activeId}`;
                  window.open(url, '_blank');
                } else {
                  setActiveTab(item.id);
                }
              }}
              className="btn"
              style={{
                justifyContent: 'flex-start',
                background: isActive ? 'var(--primary-grad)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '12px 16px',
                width: '100%',
                transition: 'var(--transition-all)',
                boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'none'
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Event Details */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Sesi Aktif
        </h4>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {eventName}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>Total Foto:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{photos.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>Preset Otomatis:</span>
          <span className="badge badge-violet" style={{ textTransform: 'capitalize' }}>
            {activePreset === 'wedding' 
              ? 'Pernikahan' 
              : activePreset === 'sports' 
                ? 'Olahraga' 
                : activePreset === 'cinematic' 
                  ? 'Sinematik' 
                  : activePreset === 'monochrome' 
                    ? 'Monokrom' 
                    : activePreset === 'none' 
                      ? 'Tanpa Preset' 
                      : activePreset === 'custom' 
                        ? 'Custom' 
                        : activePreset === 'manual' 
                          ? 'Atur Sendiri' 
                          : activePreset}
          </span>
        </div>
      </div>

      {/* Camera Status Dashboard */}
      <div className="glass-card" style={{ padding: '16px', borderLeft: cameraInfo ? '3px solid var(--accent-emerald)' : '3px solid var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
          {cameraInfo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wifi size={14} className="text-gradient-cyan" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Terhubung</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <WifiOff size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Kamera Terputus</span>
            </div>
          )}
          
          {cameraInfo && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {cameraInfo.status === 'Transferring' && <RefreshCw size={10} className="upload-active" style={{ animation: 'spin 1.5s linear infinite' }} />}
              {cameraInfo.status === 'Idle' ? 'Siaga' : cameraInfo.status === 'Capturing' ? 'Memotret' : cameraInfo.status === 'Transferring' ? 'Mentransfer' : cameraInfo.status}
            </span>
          )}
        </div>

        {cameraInfo ? (
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cameraInfo.brand} {cameraInfo.model}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${cameraInfo.battery}%`, height: '100%', background: cameraInfo.battery > 20 ? 'var(--accent-emerald)' : 'var(--accent-rose)', borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                {cameraInfo.battery}%
              </span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Hubungkan kamera USB atau buka simulator kamera untuk mulai mengambil foto.
          </p>
        )}
      </div>

      {/* Light / Dark Mode Toggle */}
      <div 
        className="glass-card"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '12px 16px', 
          marginTop: 'auto',
          boxShadow: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {theme === 'light' ? <Sun size={16} className="text-gradient-cyan" /> : <Moon size={16} className="text-gradient" />}
          <span>Mode {theme === 'light' ? 'Terang' : 'Gelap'}</span>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={theme === 'dark'} 
            onChange={toggleTheme} 
          />
          <span className="switch-slider" />
        </label>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="btn btn-danger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          fontSize: '0.85rem',
          fontWeight: 600
        }}
      >
        <LogOut size={16} />
        <span>Keluar Workstation</span>
      </button>
    </aside>
  );
};
