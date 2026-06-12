import React, { useEffect, useState } from 'react';
import { CloudProvider, useCloud } from './context/CloudContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RetouchProfilesView } from './components/RetouchProfilesView';
import { GuestGalleryView } from './components/GuestGalleryView';
import { LoginView } from './components/LoginView';
import { AlbumSelectionView } from './components/AlbumSelectionView';
import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setEventName, isLoggedIn, activeAlbumId, selectAlbum } = useCloud();
  const [isGuestView] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'gallery';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Simple query-param routing to support guest view and admin view
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

  // Render Guest view (always bypasses authentication)
  if (isGuestView) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column' }}>
        {/* Simple navigation to go back to admin panel (convenient for local debugging) */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          borderBottom: '1px solid var(--border-color)', 
          padding: '10px 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Demo Live Portal Tamu do'ipicture
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
            ← Kembali ke Workstation Fotografer
          </a>
        </div>
        
        <GuestGalleryView />
      </div>
    );
  }

  // Force authentication for the Photographer Desk / Workstation
  if (!isLoggedIn) {
    return <LoginView />;
  }

  // Gate check: If logged in but no active album is selected, render Album Selection View
  if (!activeAlbumId) {
    return <AlbumSelectionView />;
  }

  // Render Photographer admin workstation
  return (
    <div className="app-container">
      {/* Mobile top bar */}
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
  return (
    <CloudProvider>
      <AppContent />
    </CloudProvider>
  );
}

export default App;
