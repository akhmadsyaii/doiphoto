import React, { useState } from 'react';
import { useCloud } from '../context/CloudContext';
import { Server, Key, CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react';

interface ServerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerSetupModal: React.FC<ServerSetupModalProps> = ({ isOpen, onClose }) => {
  const {
    serverUrl,
    setServerUrl,
    adminToken,
    setAdminToken,
    isServerConnected
  } = useCloud();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [inputToken, setInputToken] = useState(adminToken);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    // Clean up input URL
    let formattedUrl = inputUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      // Prepend current location protocol (https: or http:) to prevent mixed content issues
      const protocol = window.location.protocol || 'http:';
      formattedUrl = `${protocol}//${formattedUrl}`;
    }
    formattedUrl = formattedUrl.replace(/\/+$/, ''); // Strip trailing slash

    try {
      const res = await fetch(`${formattedUrl}/api/health`);
      const data = await res.json();
      if (data && data.status === 'healthy') {
        // Save
        setServerUrl(formattedUrl);
        setAdminToken(inputToken.trim());
        setTestResult('success');
        
        // Auto reload after 1 second to fetch backend data
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setTestResult('failed');
      }
    } catch (err) {
      console.error(err);
      setTestResult('failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '28px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        borderRadius: '16px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Server className="text-gradient-cyan" size={24} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            Konfigurasi Server DoiPicture
          </h2>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          Hubungkan aplikasi web dashboard ini ke server backend untuk menyimpan foto di Google Drive, sinkronisasi album secara realtime, dan upload otomatis dari aplikasi mobile.
        </p>

        <form onSubmit={handleTestAndSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Server URL Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              URL Server Backend
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:8000 atau IP VPS"
                className="glass-input"
                required
                style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
              />
              <Server size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Admin Token Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Admin Security Token (API Key)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Token keamanan rahasia admin"
                className="glass-input"
                required
                style={{ width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }}
              />
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Connection Status & Test Result */}
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            marginTop: '8px'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Status Koneksi Saat Ini:</span>
            {isServerConnected ? (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Terhubung (Online)
              </span>
            ) : (
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <XCircle size={14} /> Terputus (Offline)
              </span>
            )}
          </div>

          {testResult === 'success' && (
            <div className="badge badge-cyan" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <CheckCircle2 size={16} /> Koneksi Sukses! Menyinkronkan data...
            </div>
          )}

          {testResult === 'failed' && (
            <div className="badge badge-amber" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <XCircle size={16} /> Gagal menghubungi server. Pastikan URL benar dan server aktif.
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={testing}
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {testing ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Menguji...
                </>
              ) : (
                'Simpan & Hubungkan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
