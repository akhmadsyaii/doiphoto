import React, { useState } from 'react';
import { useCloud } from '../context/CloudContext';
import { 
  FolderPlus, 
  Trash2, 
  Calendar, 
  Image as ImageIcon, 
  CloudLightning, 
  LogOut, 
  Plus, 
  X,
  ChevronRight,
  FolderOpen
} from 'lucide-react';

export const AlbumSelectionView: React.FC = () => {
  const { albums, createAlbum, selectAlbum, deleteAlbum, allPhotos, logout } = useCloud();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    
    const newId = createAlbum(newAlbumName.trim());
    setNewAlbumName('');
    setIsModalOpen(false);
    // Enter the newly created album directly
    selectAlbum(newId);
  };

  const getPhotoCount = (albumId: string) => {
    return allPhotos.filter(p => p.albumId === albumId).length;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg-deep)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden',
      paddingBottom: '80px'
    }}>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
        top: '-200px',
        left: '-100px',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-200px',
        right: '-100px',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* Header Panel */}
      <header className="glass-panel album-header" style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: 0,
        borderWidth: '0 0 1px 0',
        borderColor: 'var(--border-color)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--primary-grad)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--primary-glow)'
          }}>
            <FolderOpen size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Doi<span className="text-gradient">Photo</span>
          </h1>
        </div>

        {/* Action Logout */}
        <button 
          onClick={logout}
          className="btn btn-secondary"
          style={{
            padding: '8px 16px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </header>

      {/* Main Board Content */}
      <main style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        {/* Title Intro Block */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '1.75rem', 
              fontFamily: 'var(--font-display)', 
              fontWeight: 800,
              marginBottom: '6px'
            }}>
              Daftar Album Project
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Pilih album untuk mengelola workstation fotografer atau membuat album baru.
            </p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              boxShadow: '0 4px 14px var(--primary-glow)'
            }}
          >
            <Plus size={16} />
            <span>Buat Album Baru</span>
          </button>
        </div>

        {/* Albums Grid Board */}
        {albums.length === 0 ? (
          <div className="glass-panel" style={{
            padding: '80px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)'
            }}>
              <FolderPlus size={36} strokeWidth={1} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Belum ada album project</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto' }}>
                Buat album baru untuk mulai memantau dan meng-upload jepretan kamera secara real-time ke cloud.
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              Mulai Buat Album
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px'
          }}>
            {albums.map((album) => {
              const photoCount = getPhotoCount(album.id);
              const hasDrive = !!album.gdriveLink;

              return (
                <div 
                  key={album.id}
                  className="glass-card"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '20px',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)'
                  }}
                  onClick={() => selectAlbum(album.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Top badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Calendar size={12} />
                        {formatDate(album.createdAt)}
                      </span>

                      {hasDrive ? (
                        <span className="badge badge-cyan" style={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CloudLightning size={10} />
                          Drive Terhubung
                        </span>
                      ) : (
                        <span className="badge badge-amber" style={{ fontSize: '0.6rem' }}>
                          Drive Belum Siap
                        </span>
                      )}
                    </div>

                    {/* Album Name */}
                    <h3 style={{ 
                      fontSize: '1.2rem', 
                      fontFamily: 'var(--font-display)', 
                      fontWeight: 700, 
                      lineHeight: '1.4',
                      color: 'var(--text-primary)',
                      marginTop: '4px'
                    }}>
                      {album.name}
                    </h3>
                  </div>

                  {/* Info stats and actions footer */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={14} className="text-gradient" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {photoCount} Foto
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => selectAlbum(album.id)}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.75rem',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderColor: 'rgba(255,255,255,0.08)'
                        }}
                      >
                        <span>Buka</span>
                        <ChevronRight size={12} />
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(album.id)}
                        className="btn btn-danger"
                        style={{
                          padding: '6px 8px',
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.2)',
                          color: 'var(--accent-rose)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Hapus Album"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* "Buat Album Baru" Glassmorphic Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 7, 0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)'
        }} onClick={() => setIsModalOpen(false)}>
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              animation: 'upload-pulse 8s ease-in-out infinite'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'var(--primary-grad)',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FolderPlus size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Buat Album Baru</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Inisialisasi album project pernikahan baru Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Nama Album / Acara Pernikahan
                </label>
                <input 
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="contoh: Wedding Bella & Thoyyib"
                  className="glass-input"
                  required
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Simpan & Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 5, 7, 0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)'
        }} onClick={() => setConfirmDeleteId(null)}>
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
              borderColor: 'rgba(244, 63, 94, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
              Hapus Album Project?
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Tindakan ini permanen. Semua foto dan metadata yang terasosiasi dengan album: 
              <strong style={{ color: 'var(--text-primary)', display: 'block', margin: '6px 0' }}>
                {albums.find(a => a.id === confirmDeleteId)?.name}
              </strong>
              akan dihapus sepenuhnya dari penyimpanan local do'ipicture.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDeleteId) {
                    deleteAlbum(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }
                }}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
