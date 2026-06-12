import React, { useEffect, useState } from 'react';
import { CloudProvider, useCloud } from './context/CloudContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RetouchProfilesView } from './components/RetouchProfilesView';
import { GuestGalleryView } from './components/GuestGalleryView';
import { LoginView } from './components/LoginView';
import { AlbumSelectionView } from './components/AlbumSelectionView';
import { SplashScreen } from './components/SplashScreen';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setEventName, isLoggedIn, activeAlbumId, selectAlbum } = useCloud();
  const [isGuestView] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'gallery';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const eventParam = params.get('event');
    const albumIdParam = params.get('albumId');

    if (view === 'gallery') {
      if (albumIdParam) {
        setTimeout(() => selectAlbum(albumIdParam), 0);
      } else if (eventParam) {
        setTimeout(() => setEventName(decodeURIComponent(eventParam)), 0);
      }
    }
  }, [setEventName, selectAlbum]);

  if (isGuestView) {
    return (
      <div className="page-enter" style={{ minHeight: '100dvh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column' }}>
        <div className="premium-gallery-header" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            ✦ Galeri Tamu — do'ipicture
          </span>
          <a
            href={window.location.origin}
            style={{
              fontSize: '0.75rem',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            ← Workstation
          </a>
        </div>
        <GuestGalleryView />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <div className="page-enter"><LoginView /></div>;
  }

  if (!activeAlbumId) {
    return <div className="page-enter"><AlbumSelectionView /></div>;
  }

  return (
    <div className="app-container page-enter">
      <div className="sidebar-mobile-toggle" style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg-deep)',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
        >
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
          do'i<span className="text-gradient">picture</span>
        </span>
      </div>

      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onMobileClose={() => setMobileSidebarOpen(false)} 
      />
      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'retouch' && <RetouchProfilesView />}
      </main>
    </div>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('doiphoto_splash_shown');
  });

  const handleSplashFinish = () => {
    setShowSplash(false);
    sessionStorage.setItem('doiphoto_splash_shown', 'true');
  };

  return (
    <CloudProvider>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <div style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        <AppContent />
      </div>
    </CloudProvider>
  );
}

export default App;
