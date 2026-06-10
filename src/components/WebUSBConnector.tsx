import React, { useState } from 'react';
import { useCloud } from '../context/CloudContext';
import { Usb, AlertTriangle, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

interface USBDevice {
  open: () => Promise<void>;
  close: () => Promise<void>;
  selectConfiguration: (configValue: number) => Promise<void>;
  configuration: unknown;
  manufacturerName?: string;
  productName?: string;
  vendorId: number;
  productId: number;
  usbVersionMajor: number;
  usbVersionMinor: number;
  serialNumber?: string;
}

export const WebUSBConnector: React.FC = () => {
  const { cameraInfo, connectCamera, disconnectCamera } = useCloud();
  const [isWebUSBSupported] = useState<boolean>(() => typeof navigator !== 'undefined' && 'usb' in navigator);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deviceDetails, setDeviceDetails] = useState<{
    vendorId: string;
    productId: string;
    usbVersion: string;
    serialNumber?: string;
  } | null>(null);

  const handlePairCamera = async () => {
    setErrorMsg(null);
    if (!isWebUSBSupported) {
      setErrorMsg('WebUSB tidak didukung di browser ini. Silakan gunakan Chrome, Edge, atau Opera.');
      return;
    }

    try {
      // Prompt user to select USB device
      // Standard PTP/MTP filters: Class 6 (Imaging), Subclass 1, Protocol 1
      const usbNavigator = navigator as unknown as {
        usb: {
          requestDevice: (options: {
            filters: Array<{ classCode?: number; subclassCode?: number; protocolCode?: number }>;
          }) => Promise<USBDevice>;
        };
      };

      const device = await usbNavigator.usb.requestDevice({
        filters: [
          { classCode: 0x06, subclassCode: 0x01, protocolCode: 0x01 } // PTP/MTP Cameras
        ]
      }).catch(async () => {
        // Fallback: allow choosing any USB device if class-specific filter is too restrictive
        return await usbNavigator.usb.requestDevice({ filters: [] });
      });

      if (!device) return;

      // Open USB connection to read metadata
      await device.open();
      
      // Auto select configuration if needed
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      const brand = device.manufacturerName || 'DSLR';
      const model = device.productName || 'Camera Device';
      
      setDeviceDetails({
        vendorId: `0x${device.vendorId.toString(16).padStart(4, '0').toUpperCase()}`,
        productId: `0x${device.productId.toString(16).padStart(4, '0').toUpperCase()}`,
        usbVersion: `${device.usbVersionMajor}.${device.usbVersionMinor}`,
        serialNumber: device.serialNumber
      });

      connectCamera({
        brand,
        model,
        battery: 100, // default mock battery reading from descriptor
        connectionType: 'WebUSB',
        status: 'Idle'
      });

      // Keep device handle open or close it (closing is safer if we just read descriptors,
      // as some cameras lock up standard features when the USB session remains claimed by a web page)
      // For this demo, we keep the USB device details cached and close the session to avoid locking.
      await device.close();

    } catch (err) {
      const error = err as Error;
      console.error('WebUSB pairing failed:', error);
      if (error.name === 'NotFoundError') {
        setErrorMsg('Penyandingan dibatalkan. Tidak ada perangkat yang dipilih.');
      } else if (error.name === 'SecurityError') {
        setErrorMsg('Kesalahan keamanan: WebUSB memerlukan konteks aman (HTTPS) atau localhost.');
      } else {
        setErrorMsg(`Gagal menghubungkan: ${error.message || 'Kesalahan antarmuka USB tidak dikenal'}`);
      }
    }
  };

  const handleDisconnect = () => {
    disconnectCamera();
    setDeviceDetails(null);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Usb size={20} className="text-gradient-cyan" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Konektor Kamera WebUSB</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Hubungkan kamera mirrorless atau DSLR langsung ke browser Anda
            </p>
          </div>
        </div>
        
        {/* Support indicator */}
        <div style={{ marginLeft: 'auto' }}>
          {isWebUSBSupported ? (
            <span className="badge badge-emerald">WebUSB Didukung</span>
          ) : (
            <span className="badge badge-rose">WebUSB Tidak Didukung</span>
          )}
        </div>
      </div>

      {!isWebUSBSupported && (
        <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} color="var(--accent-rose)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
            Browser Anda saat ini tidak mendukung WebUSB API. Browser standar seperti Google Chrome, Microsoft Edge, dan Opera mendukung WebUSB. Firefox dan Safari tidak mendukung kueri perangkat USB secara langsung.
          </p>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <XCircle size={16} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>{errorMsg}</p>
        </div>
      )}

      {cameraInfo && cameraInfo.connectionType === 'WebUSB' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Koneksi Kamera Aktif</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', paddingLeft: '26px' }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Produsen:</span> {cameraInfo.brand}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Produk:</span> {cameraInfo.model}</div>
              {deviceDetails && (
                <>
                  <div><span style={{ color: 'var(--text-secondary)' }}>ID Vendor:</span> {deviceDetails.vendorId}</div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>ID Produk:</span> {deviceDetails.productId}</div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Spesifikasi USB:</span> v{deviceDetails.usbVersion}</div>
                  {deviceDetails.serialNumber && <div><span style={{ color: 'var(--text-secondary)' }}>Seri:</span> {deviceDetails.serialNumber}</div>}
                </>
              )}
            </div>
          </div>

          <button onClick={handleDisconnect} className="btn btn-danger" style={{ width: '100%' }}>
            Putuskan Sambungan Kamera USB
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={handlePairCamera}
            disabled={!isWebUSBSupported}
            className="btn btn-primary"
            style={{ width: '100%', opacity: isWebUSBSupported ? 1 : 0.5 }}
          >
            <Usb size={16} />
            Sandingkan Kamera USB
          </button>

          {/* Guidelines on DSLR settings */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
            <h4 style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <HelpCircle size={14} />
              Panduan Penyetelan untuk Kamera Fisik:
            </h4>
            <ul style={{ paddingLeft: '18px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Sony:</strong> Atur mode Koneksi USB ke "PC Remote" or "MTP" di menu penyetelan.</li>
              <li><strong>Canon / Nikon:</strong> Hubungkan kamera dan atur USB ke mass storage / PTP. Nonaktifkan "Smartphone Control" jika aktif.</li>
              <li>Gunakan kabel USB-C/OTG berkualitas tinggi dari kamera ke komputer/telepon.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
