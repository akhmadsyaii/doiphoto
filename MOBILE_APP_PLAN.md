# DoiCapture — Panduan Pembuatan Aplikasi Mobile

## Arsitektur Keseluruhan

```
┌── ANDROID (DoiCapture App) ────────┐
│                                     │
│  Kamera Canon → USB OTG → gPhoto2  │
│                           ↓         │
│              Python Service (lokal) │
│                (Termux)             │
│                           ↓         │
│              React Native App       │
│                (UI + trigger)       │
└──────────┬──────────────────────────┘
           │ upload via API (WiFi/4G)
           ↓
┌── VPS (doiphoto.likhita.my.id) ────┐
│                                     │
│  Backend API (FastAPI)              │
│  Frontend (React, existing)         │
└─────────────────────────────────────┘
           ↓
   HP/Tab/Laptop — browse doiphoto
```

## 🔷 A. Backend API (di VPS)

Tambahan di project doipicture yang udah ada.

### Struktur File
```
doiphoto/
├── backend/
│   ├── main.py              # FastAPI app + routes
│   ├── database.py          # SQLite / PostgreSQL
│   ├── models.py            # DB models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Device auth (API key)
│   └── requirements.txt
├── src/                     # Frontend existing
│   └── ...                  # (tidak berubah banyak)
└── package.json
```

### API Contract
```
POST /api/v1/photos/upload
  Auth: X-API-Key: <device_key>
  Body: multipart/form-data
    - image: file (JPEG)
    - camera_brand: string
    - camera_model: string
    - metadata: JSON { aperture, shutter, iso, focal }
  Response: { id, url, status }

GET /api/v1/photos
  Auth: Bearer <admin_token>
  Query: ?album_id=xxx&page=1&limit=20
  Response: { photos: [...], total }

GET /api/v1/photos/{id}
  Response: { id, url, metadata, created_at }

POST /api/v1/devices/register
  Body: { name: "HP Samsung A52" }
  Response: { device_id, api_key }

GET /api/v1/gallery/{album_id}
  Public — tanpa auth
  Response: { photos: [], event_name }
```

### Database Models
```
Tabel: photos
  id            UUID (PK)
  album_id      UUID (FK)
  filename      string
  original_url  string
  thumbnail_url string
  camera_brand  string
  camera_model  string
  metadata      JSON
  is_approved   bool
  is_starred    bool
  category      enum('Akad','Resepsi','Photobooth')
  created_at    timestamp
  device_id     UUID (FK)

Tabel: devices
  id            UUID (PK)
  name          string
  api_key_hash  string
  last_active   timestamp
  created_at    timestamp

Tabel: albums (existing, tambah kolom)
  - (existing) id, name, created_at
  + device_api_key string (optional)
```

### Perubahan Frontend (minimal)
```
src/context/CloudContext.tsx
  - Ganti addPhoto() localStorage → POST /api/v1/photos/upload
  - Ganti getPhotos() → GET /api/v1/photos
  - Tambah state: isLoading, error
  - Simpan admin_token di localStorage untuk auth

src/components/DashboardView.tsx
  - Ubah photo.url → ambil dari server URL
  - Auto-refresh tiap 5 detik (polling)
```

---

## 🔷 B. Android App — DoiCapture

### Stack
- **Framework:** React Native (Expo managed + dev build)
- **Bahasa:** TypeScript
- **USB Kamera:** gPhoto2 via Termux (service lokal)
- **Komunikasi:** HTTP ke localhost (Termux service)
- **Upload:** HTTPS ke VPS doiphoto

### Struktur Project
```
doicapture/
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout + provider
│   ├── index.tsx           # Home → deteksi service
│   ├── capture.tsx         # Camera capture screen
│   ├── gallery.tsx         # Local gallery preview
│   ├── settings.tsx        # API Key, server config
│   └── about.tsx           # Info
├── components/
│   ├── CameraViewfinder.tsx    # Viewfinder dari kamera
│   ├── CaptureButton.tsx       # Tombol jepret
│   ├── PhotoPreview.tsx        # Preview hasil jepret
│   ├── DeviceStatus.tsx        # Status koneksi kamera
│   ├── UploadQueue.tsx         # Antrian upload
│   └── ConnectionGuide.tsx     # Panduan colok USB
├── services/
│   ├── cameraService.ts    # Komunikasi dgn Termux gPhoto2
│   ├── uploadService.ts    # Upload foto ke VPS
│   └── storageService.ts   # Local storage (pending queue)
├── types/
│   └── index.ts            # Type definitions
├── hooks/
│   ├── useCamera.ts        # Hook kamera
│   └── useUpload.ts        # Hook upload
├── constants/
│   └── config.ts           # Default server URL, dll
├── termux/
│   ├── setup_termux.sh     # Script instalasi Termux
│   ├── camera_service.py   # Python service gPhoto2
│   └── requirements.txt    # Python deps
└── app.json
```

### Screen Flow
```
Splash → Home
          ↓
    [Connect] → Guide → scan QR / masukkan server URL
          ↓
      Connected → Capture Screen
                    ↓
              [JEPRET]
                    ↓
              Preview → [Upload] → VPS
                    ↓
                 Gallery (lokal) → retry upload
```

### Fitur Per Screen

#### Screen: Home (`index.tsx`)
- Cek status Termux service running
- Cek koneksi kamera via USB
- Tampilkan status: ✅ Kamera siap / ⚠️ Colok kamera / ❌ Service mati
- Tombol "Mulai Capture"
- QR code scanner untuk set server URL

#### Screen: Capture (`capture.tsx`)
- Viewfinder preview (dari gPhoto2 preview)
- Info kamera: model, aperture, ISO, shutter
- Tombol jepret besar (pink, bulat)
- Thumbnail hasil terakhir
- Timer mode (countdown 3-5-10 detik)
- Flash effect animasi
- Upload progress bar

#### Screen: Settings (`settings.tsx`)
- Server URL (default: https://doiphoto.likhita.my.id)
- API Key device (register dari web admin)
- Nama device
- Album aktif
- Auto-upload toggle
- Timer default
- Kualitas foto

#### Screen: Gallery (`gallery.tsx`)
- Grid foto hasil capture
- Status: ⏳ pending, ✅ uploaded, ❌ failed
- Swipe to retry failed upload
- Tombol hapus lokal

### Service: Termux gPhoto2

**`termux/camera_service.py`**
```python
#!/usr/bin/env python3
"""
Service lokal yang jalan di Termux.
Komunikasi via HTTP di localhost:4777
"""

from flask import Flask, jsonify, request
import subprocess, json, base64, os

app = Flask(__name__)
gphoto2_path = "/data/data/com.termux/files/usr/bin/gphoto2"
current_image = None

@app.route("/status")
def status():
    """Cek koneksi kamera"""
    result = subprocess.run(
        [gphoto2_path, "--abilities"],
        capture_output=True, text=True
    )
    is_connected = "Canon" in result.stdout or "Nikon" in result.stdout
    return jsonify({
        "connected": is_connected,
        "model": parse_model(result.stdout) if is_connected else None
    })

@app.route("/capture")
def capture():
    """Ambil foto"""
    global current_image
    # Ambil dari SD card (lebih cepat dari live view)
    result = subprocess.run(
        [gphoto2_path, "--capture-image-and-download", "--filename", "/tmp/doicapture_%Y%m%d_%H%M%S.jpg"],
        capture_output=True, text=True, timeout=30
    )
    # Baca file hasil
    import glob
    files = glob.glob("/tmp/doicapture_*.jpg")
    if files:
        current_image = max(files, key=os.path.getctime)
        with open(current_image, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
        os.remove(current_image)
        return jsonify({"image": img_b64, "filename": os.path.basename(current_image)})
    return jsonify({"error": "Capture failed"}), 500

@app.route("/preview")
def preview():
    """Live view (low res buat viewfinder)"""
    result = subprocess.run(
        [gphoto2_path, "--capture-preview", "--filename", "/tmp/doicapture_preview.jpg"],
        capture_output=True, text=True, timeout=10
    )
    if os.path.exists("/tmp/doicapture_preview.jpg"):
        with open("/tmp/doicapture_preview.jpg", "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
        os.remove("/tmp/doicapture_preview.jpg")
        return jsonify({"image": img_b64})
    return jsonify({"error": "No preview"}), 500

@app.route("/config")
def config():
    """Baca setting kamera"""
    result = subprocess.run(
        [gphoto2_path, "--get-config", "iso"],
        capture_output=True, text=True
    )
    return jsonify({"iso": result.stdout})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=4777)
```

### Service: Upload (`uploadService.ts`)
```typescript
import { Platform } from 'react-native';

interface UploadConfig {
  serverUrl: string;
  apiKey: string;
  albumId?: string;
}

export async function uploadPhoto(
  base64Image: string,
  metadata: CameraMetadata,
  config: UploadConfig
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('image', {
    uri: Platform.OS === 'android' 
      ? `file:///data/data/com.doicapture/cache/photo.jpg`
      : `file://${imagePath}`,
    type: 'image/jpeg',
    name: `doicapture_${Date.now()}.jpg`,
  } as any);
  formData.append('camera_brand', metadata.brand);
  formData.append('camera_model', metadata.model);
  formData.append('metadata', JSON.stringify(metadata.exif));

  const response = await fetch(`${config.serverUrl}/api/v1/photos/upload`, {
    method: 'POST',
    headers: {
      'X-API-Key': config.apiKey,
    },
    body: formData,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return response.json();
}
```

### Komponen: CameraViewfinder.tsx
```typescript
import { useState, useEffect } from 'react';
import { View, Image, Text } from 'react-native';

export function CameraViewfinder({ 
  serviceUrl 
}: { 
  serviceUrl: string 
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [camInfo, setCamInfo] = useState<CameraInfo | null>(null);

  // Poll preview tiap 2 detik
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${serviceUrl}/preview`);
        const data = await res.json();
        if (data.image) setPreview(`data:image/jpeg;base64,${data.image}`);
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [serviceUrl]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {preview ? (
        <Image source={{ uri: preview }} style={{ flex: 1 }} />
      ) : (
        <Text style={styles.loading}>Menghubungkan kamera...</Text>
      )}
    </View>
  );
}
```

---

## 🔷 C. Setup & Instalasi

### 1. Di HP Android (Termux)
```bash
# Install Termux dari F-Droid (bukan Play Store)
# Buka Termux, jalankan:
pkg update && pkg upgrade
pkg install python git gphoto2 termux-api
pip install flask

# Download service
cd ~ && mkdir doicapture && cd doicapture
curl -O https://raw.githubusercontent.com/akhmadsyaii/doicapture/main/termux/camera_service.py

# Install gPhoto2 untuk Android:
pkg install libgphoto2

# Jalanin service
python camera_service.py &
# Service jalan di localhost:4777
```

### 2. Install DoiCapture App
```bash
# Clone + build React Native
git clone https://github.com/akhmadsyaii/doicapture
cd doicapture
npm install
npx expo run:android
```

Atau kalo nggak mau build bisa install APK hasil build.

### 3. Di VPS (Backend)
```bash
cd doiphoto
mkdir -p backend

# Buat file-file backend
# lalu deploy sebagai service baru
```

### 4. Di Web doiphoto (Frontend)
```python
# Ubah CloudContext.tsx:
# - Ganti localStorage → fetch API
# - Tambah polling auto-refresh
# - Tambah indicator koneksi device
```

---

## 🔷 D. Alur Kerja Lengkap

```
1. User colok Canon → HP Android (kabel OTG)
2. Buka Termux → jalanin camera_service.py
3. Buka DoiCapture App → detect service → "Kamera Siap"
4. Tap "JEPRET" → gPhoto2 capture → preview muncul
5. Auto upload ke doiphoto.likhita.my.id via API
6. Tamu scan QR → buka guest gallery → liat foto live
7. Admin buka doiphoto dashboard → kurasi, edit, approve
```

---

## 🔷 E. Timeline & Prioritas

### Phase 1 (Hari 1-2): Backend API
- [ ] Buat FastAPI backend + SQLite
- [ ] Endpoint upload, list photos, device register
- [ ] Deploy ke VPS sebagai container

### Phase 2 (Hari 3-4): Frontend Connection
- [ ] Ubah CloudContext pakai API
- [ ] Ganti localStorage → server
- [ ] Tambah auto-refresh gallery

### Phase 3 (Hari 5-7): Android App
- [ ] Setup Expo project + routing
- [ ] Capture screen + gPhoto2 service
- [ ] Upload service
- [ ] Settings screen
- [ ] Gallery screen

### Phase 4 (Hari 8): Integrasi & Test
- [ ] End-to-end: colok kamera → capture → upload → gallery
- [ ] QR code → guest view
- [ ] Error handling + retry

---

Mau liat isi kode lengkap untuk file tertentu dulu? Atau langsung gue bikin file-file project-nya biar tinggal di-push?
