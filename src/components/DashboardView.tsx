import React, { useState } from 'react';
import { useCloud, type Photo } from '../context/CloudContext';
import { CameraSimulator } from './CameraSimulator';
import { WebUSBConnector } from './WebUSBConnector';
import { ShareModal } from './ShareModal';
import { 
  Edit3, 
  Trash2, 
  Share2, 
  Activity, 
  Eye, 
  Check, 
  Cpu, 
  Download,
  Users,
  FileCheck,
  UserCheck,
  Star,
  FolderOpen,
  ChevronRight,
  X
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    eventName, 
    setEventName, 
    photos, 
    clearPhotos, 
    deletePhoto,
    activePreset,
    setActivePreset,
    isAutoRetouchEnabled,
    setIsAutoRetouchEnabled,
    viewingPhoto,
    setViewingPhoto,
    toggleReviewStatus,
    toggleStarPhoto,
    
    reviewerMode,
    setReviewerMode,
    teamPhotographers,
    isTeamStreamActive,
    setIsTeamStreamActive,
    gdriveLink,
    setGDriveLink,
    cameraInfo
  } = useCloud();

  const [isEditingEvent, setIsEditingEvent] = useState<boolean>(false);
  const [eventInput, setEventInput] = useState<string>(eventName);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'semua' | 'belum' | 'sedang' | 'selesai' | 'gagal'>('semua');
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  
  // Sub-tabs on Dashboard
  const [dashTab, setDashTab] = useState<'feed' | 'reviewer' | 'team'>('feed');

  const saveEventName = () => {
    if (eventInput.trim()) {
      setEventName(eventInput);
    }
    setIsEditingEvent(false);
  };

  const handleDownload = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter photos pending reviewer approval
  const pendingPhotos = photos.filter(p => !p.isApproved);
  // Filter photos that are approved and live
  const livePhotos = photos.filter(p => p.isApproved && p.status === 'done');



  return (
    <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', flex: 1, minHeight: 0 }}>
      {/* Left Column: Photos Queue, Desk Tabs & Session info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        
        {/* Mobile right panel toggle */}
        <div className="sidebar-mobile-toggle" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '-16px'
        }}>
          <button
            onClick={() => setMobileRightOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.75rem', gap: '6px' }}
          >
            Kamera & Koneksi
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Event Banner */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="event-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {isEditingEvent ? (
                <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '500px' }}>
                  <input
                    type="text"
                    value={eventInput}
                    onChange={(e) => setEventInput(e.target.value)}
                    className="glass-input"
                    style={{ flex: 1, fontWeight: 700, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveEventName()}
                  />
                  <button onClick={saveEventName} className="btn btn-primary" style={{ padding: '0 16px' }}>
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                    {eventName}
                  </h1>
                  <button 
                    onClick={() => { setEventInput(eventName); setIsEditingEvent(true); }} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    title="Ubah Nama Event"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="event-actions" style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsShareOpen(true)} className="btn btn-primary">
                <Share2 size={16} />
                <span className="hide-mobile">Bagikan Galeri</span>
              </button>
              <button onClick={clearPhotos} className="btn btn-danger" title="Hapus Semua Foto">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Quick Metrics & Auto Retouch Settings */}
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            
            {/* Auto Retouch Setting */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px', borderRight: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Cpu size={14} /> Retouch AI Otomatis
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Terapkan preset otomatis saat upload
                </span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isAutoRetouchEnabled} 
                  onChange={(e) => setIsAutoRetouchEnabled(e.target.checked)} 
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Reviewer Gate Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px', borderRight: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <UserCheck size={14} /> Mode Kurator
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Tahan foto untuk disetujui sebelum live
                </span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={reviewerMode} 
                  onChange={(e) => setReviewerMode(e.target.checked)} 
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Active Preset Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block' }}>
                  Profil Preset Otomatis
                </span>
                <select 
                  value={activePreset} 
                  onChange={(e) => setActivePreset(e.target.value)}
                  disabled={!isAutoRetouchEnabled}
                  className="glass-input" 
                  style={{ width: '100%', padding: '4px 8px', marginTop: '4px', fontSize: '0.75rem', opacity: isAutoRetouchEnabled ? 1 : 0.5 }}
                >
                  <option value="none">— Tanpa Preset (No Preset) —</option>
                  <option value="wedding">Pernikahan Lembut & Hangat</option>
                  <option value="sports">Olahraga Aksi Vivid</option>
                  <option value="cinematic">Sinematik Moody</option>
                  <option value="monochrome">Noir Klasik Hitam & Putih</option>
                  <option value="custom">Preset Custom (Lightroom)</option>
                  <option value="manual">Atur Sendiri</option>
                </select>
              </div>
            </div>

          </div>

          {/* Cloud Storage Integration Card */}
          <div style={{ 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <FolderOpen size={14} className="text-gradient-cyan" /> Backup Cloud (Google Drive)
              </span>
              {gdriveLink ? (
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  Google Drive Terhubung
                </span>
              ) : (
                <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                  Belum Dikonfigurasi
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={gdriveLink}
                onChange={(e) => setGDriveLink(e.target.value)}
                className="glass-input"
                placeholder="Tempel link folder bersama Google Drive"
                style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px' }}
              />
              {gdriveLink && (
                <a 
                  href={gdriveLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Tes Link
                </a>
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Setelah dikonfigurasi, tamu dapat men-download file asli beresolusi tinggi langsung melalui tombol di galeri live, dan Anda dapat membuat QR code yang mengarah ke folder Drive ini.
            </p>
          </div>

        </div>

        {/* Dashboard Workstation Tab Navigators */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px', overflowX: 'auto' }}>
          {([
            { id: 'feed', label: 'Antrean Foto', count: photos.length, icon: Activity, highlight: false },
            { id: 'reviewer', label: 'Kurasi Foto', count: pendingPhotos.length, icon: FileCheck, highlight: pendingPhotos.length > 0 },
            { id: 'team', label: 'Panel Tim', count: teamPhotographers.filter(p => p.isOnline).length, icon: Users, highlight: false }
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isTabActive = dashTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDashTab(tab.id)}
                style={{
                  background: isTabActive ? 'var(--btn-secondary-bg)' : 'transparent',
                  border: 'none',
                  borderBottom: isTabActive ? '3px solid var(--primary)' : '3px solid transparent',
                  color: isTabActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Icon size={14} style={{ color: tab.highlight && !isTabActive ? 'var(--accent-amber)' : 'currentColor' }} />
                <span className="hide-mobile">{tab.label}</span>
                <span className="sidebar-mobile-toggle" style={{ fontSize: '0.85rem' }}>{tab.label}</span>
                <span 
                  className={`badge ${tab.highlight ? 'badge-amber' : isTabActive ? 'badge-violet' : 'badge-cyan'}`} 
                  style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px' }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab view components */}
        <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
          
          {/* TAB 1: Live Feed Queue */}
          {dashTab === 'feed' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Aliran Foto Live Kamera
                </h3>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span className="badge badge-emerald">{livePhotos.length} Live di Galeri</span>
                  {reviewerMode && <span className="badge badge-amber">{pendingPhotos.length} Menunggu Kurasi</span>}
                </div>
              </div>

              {/* Status Filters Bar */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', overflowX: 'auto' }}>
                {([
                  { id: 'semua', label: 'Semua', count: photos.length, highlight: '' },
                  { id: 'belum', label: 'Belum', count: photos.filter(p => p.status === 'uploading').length, highlight: 'var(--accent-amber)' },
                  { id: 'sedang', label: 'Sedang', count: photos.filter(p => p.status === 'processing').length, highlight: 'var(--primary)' },
                  { id: 'selesai', label: 'Selesai', count: photos.filter(p => p.status === 'done').length, highlight: 'var(--accent-emerald)' },
                  { id: 'gagal', label: 'Gagal', count: photos.filter(p => p.status === 'failed').length, highlight: 'var(--accent-rose)' }
                ] as const).map((item) => {
                  const isActive = statusFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setStatusFilter(item.id)}
                      style={{
                      background: isActive ? 'var(--btn-secondary-bg)' : 'transparent',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      <span>{item.label}</span>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        background: isActive ? 'var(--primary)' : 'var(--btn-secondary-bg)', 
                        color: isActive ? '#fff' : item.highlight || 'var(--text-muted)', 
                        padding: '1px 6px', 
                        borderRadius: '10px',
                        fontWeight: 700
                      }}>
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!cameraInfo ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  margin: '20px 0'
                }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '16px', animation: 'upload-pulse 2s ease-in-out infinite' }}>🤔</div>
                  
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Kamera Tidak Terhubung
                  </h3>
                  
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Anda dapat mencoba langkah-langkah berikut:
                  </p>
                  
                  <ul style={{ 
                    textAlign: 'left', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-muted)', 
                    maxWidth: '440px', 
                    margin: '0 auto 16px auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingLeft: '20px',
                    lineHeight: '1.5'
                  }}>
                    <li>1. Nyalakan daya kamera dan matikan Penghemat Daya Baterai di Ponsel/Komputer dan Kamera.</li>
                    <li>2. Pastikan kedua ujung kabel USB/OTG terpasang dengan kuat.</li>
                    <li>3. Berikan izin akses USB hanya untuk aplikasi web ini saat diminta browser.</li>
                  </ul>
                  
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Hubungkan kamera melalui Konektor Kamera WebUSB di kanan bawah, atau aktifkan kamera virtual di panel atas.'); }} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'block', marginBottom: '16px' }}>
                    Silakan merujuk ke 《Manual Bantuan Koneksi》
                  </a>
                  
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    🎧 Hubungi layanan pelanggan untuk mendapatkan bantuan
                  </span>
                </div>
              ) : photos.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', padding: '60px 0' }}>
                  <Activity size={44} strokeWidth={1} className="upload-active" />
                  <p style={{ fontSize: '0.85rem' }}>Menunggu jepretan kamera...</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const filtered = photos.filter(p => {
                      if (statusFilter === 'semua') return true;
                      return p.status === (statusFilter === 'belum' ? 'uploading' : statusFilter === 'sedang' ? 'processing' : statusFilter === 'selesai' ? 'done' : 'failed');
                    });
                    
                    if (filtered.length === 0) {
                      return (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', padding: '60px 0' }}>
                          <Activity size={32} strokeWidth={1.5} />
                          <p style={{ fontSize: '0.85rem' }}>Tidak ada foto dalam status ini.</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="photo-grid" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '16px', alignContent: 'start' }}>
                        {filtered.map((photo) => (
                          <div 
                            key={photo.id}
                            className="glass-card" 
                            style={{ 
                              borderRadius: '10px', 
                              overflow: 'hidden', 
                              border: '1px solid var(--border-color)',
                              aspectRatio: '3/4',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative'
                            }}
                          >
                            {/* Photo Thumbnail */}
                            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)' }}>
                              <img 
                                src={photo.url} 
                                alt={photo.name} 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  filter: photo.status !== 'done' ? 'blur(3px)' : 'none',
                                  transition: 'filter 0.3s'
                                }} 
                              />
                              
                              {/* Status overlays */}
                              <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {photo.status === 'uploading' && <span className="badge badge-amber upload-active" style={{ fontSize: '0.55rem' }}>Uploading...</span>}
                                {photo.status === 'processing' && <span className="badge badge-violet upload-active" style={{ fontSize: '0.55rem' }}>Memproses AI...</span>}
                                {photo.status === 'done' && photo.preset !== 'none' && (
                                   <span className="badge badge-violet" style={{ fontSize: '0.55rem', textTransform: 'capitalize' }}>
                                     {photo.preset === 'wedding' ? 'Pernikahan' : photo.preset === 'sports' ? 'Olahraga' : photo.preset === 'cinematic' ? 'Sinematik' : photo.preset === 'monochrome' ? 'Monokrom' : photo.preset === 'custom' ? 'Custom' : photo.preset === 'manual' ? 'Manual' : photo.preset}
                                   </span>
                                 )}
                                {!photo.isApproved && photo.status === 'done' && (
                                  <span className="badge badge-amber" style={{ fontSize: '0.55rem' }}>Ditahan Kurasi</span>
                                )}
                              </div>

                              {/* Star overlay indicator */}
                              {photo.isStarred && (
                                <div style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 5 }}>
                                  <span className="badge badge-amber" style={{ padding: '3px' }}><Star size={10} fill="currentColor" /></span>
                                </div>
                              )}

                              {/* Folder/Category overlay label */}
                              <div style={{ position: 'absolute', bottom: '6px', left: '6px', zIndex: 5 }}>
                                <span className="badge badge-cyan" style={{ fontSize: '0.55rem', padding: '1px 4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <FolderOpen size={8} /> {photo.category}
                                </span>
                              </div>

                              {/* Hover triggers */}
                              {photo.status === 'done' && (
                                <div 
                                  style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    background: 'rgba(0,0,0,0.5)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '12px',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    cursor: 'pointer'
                                  }}
                                  className="photo-overlay"
                                  onClick={() => setViewingPhoto(photo)}
                                >
                                  <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }} title="Lihat Detail">
                                    <Eye size={12} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownload(photo); }}
                                    className="btn btn-secondary" 
                                    style={{ padding: '8px', borderRadius: '50%' }} 
                                    title="Download"
                                  >
                                    <Download size={12} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Info bar */}
                            <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {photo.name}
                              </span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                <span>#{photo.shutterCount}</span>
                                <span>{new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                              </div>
                            </div>

                            <style>{`
                              .glass-card:hover .photo-overlay {
                                opacity: 1 !important;
                              }
                            `}</style>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {/* TAB 2: Reviewer Approval Desk */}
          {dashTab === 'reviewer' && (
            <>
              <div>
                <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Meja Kurator & Persetujuan Kualitas
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Setujui foto untuk langsung mempublikasikannya ke tamu yang memindai QR code, atau tolak untuk menghapusnya dari database cloud.
                </p>
              </div>

              {!reviewerMode && (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-amber)' }}>Mode Kurator Nonaktif</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Mode kurator saat ini dinonaktifkan. Semua foto yang diambil oleh kamera akan otomatis melewati gerbang ini dan langsung terlihat oleh publik. Aktifkan "Mode Kurator" di atas untuk mengaktifkannya kembali.
                  </p>
                </div>
              )}

              {reviewerMode && pendingPhotos.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', padding: '60px 0' }}>
                  <FileCheck size={44} strokeWidth={1} style={{ color: 'var(--accent-emerald)' }} />
                  <p style={{ fontSize: '0.85rem' }}>Tidak ada foto yang menunggu persetujuan. Antrean kurasi bersih!</p>
                </div>
              ) : reviewerMode && (
                <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', alignContent: 'start' }}>
                  {pendingPhotos.map((photo) => (
                    <div 
                      key={photo.id}
                      className="glass-card" 
                      style={{ 
                        borderRadius: '10px', 
                        overflow: 'hidden', 
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-surface)'
                      }}
                    >
                      {/* Image preview */}
                      <div style={{ height: '150px', position: 'relative', background: '#000' }}>
                        <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span className="badge badge-cyan" style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '0.55rem' }}>
                          {photo.category}
                        </span>
                        {photo.isStarred && (
                          <span className="badge badge-amber" style={{ position: 'absolute', top: '6px', right: '6px', padding: '3px' }}>
                            <Star size={10} fill="currentColor" />
                          </span>
                        )}
                      </div>

                      {/* Approvals button row */}
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                          <span>{photo.name}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>#{photo.shutterCount}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button 
                            onClick={() => toggleReviewStatus(photo.id, true)} 
                            className="btn btn-primary"
                            style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem', background: 'var(--accent-emerald)', border: 'none', boxShadow: 'none' }}
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => deletePhoto(photo.id)} 
                            className="btn btn-danger"
                            style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem' }}
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 3: Team Collaboration Panel */}
          {dashTab === 'team' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Panel Kolaborasi Tim Fotografer
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Kelola koneksi fotografer dan simulasikan upload latar belakang tim.
                  </p>
                </div>
              </div>

              {/* Team list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {teamPhotographers.map((p, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      width: '38px', 
                      height: '38px', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <Users size={16} />
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: p.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)', 
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        border: '2px solid var(--bg-surface)'
                      }} />
                    </div>
                    
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.camera}</p>
                    </div>

                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: p.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                      {p.lastActive}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stream simulation controls */}
              <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>Simulasikan Aliran Jepretan Tim</span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Membuat fotografer simulasi Aris dan Dina mengambil dan mengupload foto secara otomatis.
                  </p>
                </div>
                
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={isTeamStreamActive} 
                    onChange={(e) => setIsTeamStreamActive(e.target.checked)} 
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </>
          )}



        </div>
      </div>

      {/* Right Column: Connection Dials */}
      <div className={`dash-right-panel ${mobileRightOpen ? 'mobile-visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '360px', flexShrink: 0 }}>
        {/* Mobile close button */}
        <div className="sidebar-mobile-toggle" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setMobileRightOpen(false)}
            className="btn btn-secondary"
            style={{ padding: '8px', fontSize: '0.75rem' }}
          >
            <X size={16} />
            Tutup
          </button>
        </div>
        <CameraSimulator />
        <WebUSBConnector />
      </div>

      {/* Lightbox Modal display */}
      {viewingPhoto && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(5,5,7,0.95)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }} onClick={() => setViewingPhoto(null)}>
          
          <div style={{ 
            position: 'relative', 
            maxWidth: '90vw', 
            maxHeight: '85vh', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px' 
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ position: 'relative', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <img 
                src={viewingPhoto.url} 
                alt={viewingPhoto.name} 
                style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block', objectFit: 'contain' }} 
              />
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1rem' }}>{viewingPhoto.name}</h4>
                    {viewingPhoto.isStarred && <span className="badge badge-amber" style={{ padding: '2px 6px', fontSize: '0.6rem' }}>Dikunci Bintang</span>}
                    <span className="badge badge-cyan" style={{ padding: '2px 6px', fontSize: '0.6rem' }}>{viewingPhoto.category}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span>Shutter: #{viewingPhoto.shutterCount}</span>
                    <span>Preset: <strong style={{ color: 'var(--primary)' }} className="text-gradient">{viewingPhoto.preset === 'wedding' ? 'Pernikahan' : viewingPhoto.preset === 'sports' ? 'Olahraga' : viewingPhoto.preset === 'cinematic' ? 'Sinematik' : viewingPhoto.preset === 'monochrome' ? 'Monokrom' : viewingPhoto.preset === 'custom' ? 'Custom' : viewingPhoto.preset === 'manual' ? 'Manual' : viewingPhoto.preset === 'none' ? 'Tanpa Preset' : viewingPhoto.preset}</strong></span>
                    {viewingPhoto.metadata?.cameraBrand && (
                      <span>Kamera: {viewingPhoto.metadata.cameraBrand} {viewingPhoto.metadata.cameraModel}</span>
                    )}
                  </div>
                </div>
              </div>
              {viewingPhoto.metadata && (
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap', fontFamily: 'monospace' }}>
                  <span>Aperture: {viewingPhoto.metadata.aperture}</span>
                  <span>Shutter: {viewingPhoto.metadata.shutterSpeed}</span>
                  <span>ISO: {viewingPhoto.metadata.iso}</span>
                  <span>Lensa: {viewingPhoto.metadata.focalLength}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => toggleStarPhoto(viewingPhoto.id)} className="btn btn-secondary" style={{ color: viewingPhoto.isStarred ? 'var(--accent-amber)' : 'inherit' }}>
                  <Star size={14} fill={viewingPhoto.isStarred ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => handleDownload(viewingPhoto)} className="btn btn-primary">
                  <Download size={14} /> Download
                </button>
                <button onClick={() => deletePhoto(viewingPhoto.id)} className="btn btn-danger">
                  <Trash2 size={14} /> Hapus
                </button>
                <button onClick={() => setViewingPhoto(null)} className="btn btn-secondary">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Album Modal */}
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
    </div>
  );
};
