/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyAIRetouch } from '../utils/AIRetoucher';

export interface Album {
  id: string;
  name: string;
  createdAt: number;
  gdriveLink: string;
  watermarkType: 'none' | 'text' | 'image' | 'both';
  watermarkText: string;
  watermarkImage: string | null;
  watermarkFont?: string;
  watermarkFramePreset?: string;
  watermarkTextLine1?: string;
  watermarkTextLine2?: string;
  watermarkTextLine3?: string;
  watermarkFontLine1?: string;
  watermarkFontLine2?: string;
  watermarkFontLine3?: string;
  activePreset: string;
  isAutoRetouchEnabled: boolean;
  reviewerMode: boolean;
  manualBrightness?: number;
  manualContrast?: number;
  manualSaturation?: number;
  manualExposure?: number;
  manualWarmth?: number;
  customPresetName?: string | null;
  customBrightness?: number;
  customContrast?: number;
  customSaturation?: number;
  customExposure?: number;
  customWarmth?: number;
}

export interface Photo {
  id: string;
  name: string;
  originalUrl: string;
  url: string;
  timestamp: number;
  preset: string;
  status: 'uploading' | 'processing' | 'done' | 'failed';
  shutterCount: number;
  isStarred: boolean;
  category: 'Akad' | 'Resepsi' | 'Photobooth';
  isApproved: boolean;
  editorStatus: 'Raw' | 'Needs Editor' | 'Edited';
  faceIds: number[]; 
  albumId: string;
  metadata?: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
    focalLength?: string;
    cameraBrand?: string;
    cameraModel?: string;
  };
}

export interface CameraInfo {
  brand: string;
  model: string;
  battery: number;
  connectionType: 'WebUSB' | 'Simulator';
  status: 'Idle' | 'Capturing' | 'Transferring';
}

export interface Photographer {
  name: string;
  camera: string;
  isOnline: boolean;
  lastActive: string;
}

interface CloudContextType {
  activeTab: 'dashboard' | 'retouch' | 'gallery';
  setActiveTab: (tab: 'dashboard' | 'retouch' | 'gallery') => void;
  eventName: string;
  setEventName: (name: string) => void;
  photos: Photo[];
  addPhoto: (
    base64OrUrl: string, 
    name?: string, 
    metadata?: Photo['metadata'],
    options?: { category?: Photo['category']; isStarred?: boolean }
  ) => Promise<Photo>;
  updatePhotoPreset: (id: string, presetName: string) => Promise<void>;
  toggleStarPhoto: (id: string) => void;
  toggleReviewStatus: (id: string, approved: boolean) => void;
  deletePhoto: (id: string) => void;
  clearPhotos: () => void;
  cameraInfo: CameraInfo | null;
  connectCamera: (info: CameraInfo) => void;
  disconnectCamera: () => void;
  setCameraStatus: (status: CameraInfo['status']) => void;
  activePreset: string;
  setActivePreset: (preset: string) => void;
  isAutoRetouchEnabled: boolean;
  setIsAutoRetouchEnabled: (enabled: boolean) => void;
  viewingPhoto: Photo | null;
  setViewingPhoto: (photo: Photo | null) => void;
  
  // Advanced Features
  uploadMode: 'auto' | 'starred' | 'manual';
  setUploadMode: (mode: 'auto' | 'starred' | 'manual') => void;
  reviewerMode: boolean;
  setReviewerMode: (enabled: boolean) => void;
  watermarkText: string;
  setWatermarkText: (text: string) => void;
  watermarkTextLine1: string;
  setWatermarkTextLine1: (text: string) => void;
  watermarkTextLine2: string;
  setWatermarkTextLine2: (text: string) => void;
  watermarkTextLine3: string;
  setWatermarkTextLine3: (text: string) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (opacity: number) => void;
  watermarkSize: number;
  setWatermarkSize: (size: number) => void;
  watermarkType: 'none' | 'text' | 'image' | 'both';
  setWatermarkType: (type: 'none' | 'text' | 'image' | 'both') => void;
  watermarkImage: string | null;
  setWatermarkImage: (image: string | null) => void;
  watermarkFont: string;
  setWatermarkFont: (font: string) => void;
  watermarkFontLine1: string;
  setWatermarkFontLine1: (font: string) => void;
  watermarkFontLine2: string;
  setWatermarkFontLine2: (font: string) => void;
  watermarkFontLine3: string;
  setWatermarkFontLine3: (font: string) => void;
  watermarkFramePreset: string;
  setWatermarkFramePreset: (preset: string) => void;
  guestSelfie: string | null;
  setGuestSelfie: (selfie: string | null) => void;
  isFacialSmoothingEnabled: boolean;
  setIsFacialSmoothingEnabled: (enabled: boolean) => void;
  isPlateBlurringEnabled: boolean;
  setIsPlateBlurringEnabled: (enabled: boolean) => void;
  isBlurryFilterEnabled: boolean;
  setIsBlurryFilterEnabled: (enabled: boolean) => void;
  teamPhotographers: Photographer[];
  isTeamStreamActive: boolean;
  setIsTeamStreamActive: (active: boolean) => void;

  // New Preset Option Settings
  manualBrightness: number;
  setManualBrightness: (val: number) => void;
  manualContrast: number;
  setManualContrast: (val: number) => void;
  manualSaturation: number;
  setManualSaturation: (val: number) => void;
  manualExposure: number;
  setManualExposure: (val: number) => void;
  manualWarmth: number;
  setManualWarmth: (val: number) => void;
  customPresetName: string | null;
  setCustomPresetName: (val: string | null) => void;
  customBrightness: number;
  setCustomBrightness: (val: number) => void;
  customContrast: number;
  setCustomContrast: (val: number) => void;
  customSaturation: number;
  setCustomSaturation: (val: number) => void;
  customExposure: number;
  setCustomExposure: (val: number) => void;
  customWarmth: number;
  setCustomWarmth: (val: number) => void;

  // Authentication & Google Drive Cloud Integration
  isLoggedIn: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  gdriveLink: string;
  setGDriveLink: (link: string) => void;
  qrTargetMode: 'gallery' | 'gdrive';
  setQrTargetMode: (mode: 'gallery' | 'gdrive') => void;

  // Multi-Album State
  albums: Album[];
  activeAlbumId: string | null;
  createAlbum: (name: string) => string;
  selectAlbum: (id: string | null) => void;
  deleteAlbum: (id: string) => void;
  allPhotos: Photo[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  adminToken: string;
  setAdminToken: (token: string) => void;
  isServerConnected: boolean;
  setIsServerConnected: (connected: boolean) => void;
}

const CloudContext = createContext<CloudContextType | undefined>(undefined);

const SIMULATED_SHOT_IMAGES = [
  'https://images.unsplash.com/photo-1519225495810-7517c296517a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop'
];

export const CloudProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getActiveAlbumVal = <K extends keyof Album>(key: K, fallback: Exclude<Album[K], undefined>): Exclude<Album[K], undefined> => {
    const savedAlbums = localStorage.getItem('doiphoto_albums');
    const activeId = localStorage.getItem('doiphoto_active_album_id');
    if (savedAlbums && activeId) {
      try {
        const parsed = JSON.parse(savedAlbums) as Album[];
        const activeAlbum = parsed.find(a => a.id === activeId);
        if (activeAlbum && activeAlbum[key] !== undefined) {
          return activeAlbum[key] as Exclude<Album[K], undefined>;
        }
      } catch {
        // ignore
      }
    }
    return fallback;
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'retouch' | 'gallery'>('dashboard');
  const [eventName, setEventNameState] = useState<string>('Pernikahan Agung 2026');

  // Theme states (Light default, priority)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('doiphoto_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('doiphoto_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Manual Adjustments States
  const [manualBrightness, setManualBrightnessState] = useState<number>(() => getActiveAlbumVal('manualBrightness', 1.0));
  const [manualContrast, setManualContrastState] = useState<number>(() => getActiveAlbumVal('manualContrast', 1.0));
  const [manualSaturation, setManualSaturationState] = useState<number>(() => getActiveAlbumVal('manualSaturation', 1.0));
  const [manualExposure, setManualExposureState] = useState<number>(() => getActiveAlbumVal('manualExposure', 0.0));
  const [manualWarmth, setManualWarmthState] = useState<number>(() => getActiveAlbumVal('manualWarmth', 0.0));

  // Custom Preset States
  const [customPresetName, setCustomPresetNameState] = useState<string | null>(() => getActiveAlbumVal('customPresetName', null));
  const [customBrightness, setCustomBrightnessState] = useState<number>(() => getActiveAlbumVal('customBrightness', 1.0));
  const [customContrast, setCustomContrastState] = useState<number>(() => getActiveAlbumVal('customContrast', 1.0));
  const [customSaturation, setCustomSaturationState] = useState<number>(() => getActiveAlbumVal('customSaturation', 1.0));
  const [customExposure, setCustomExposureState] = useState<number>(() => getActiveAlbumVal('customExposure', 0.0));
  const [customWarmth, setCustomWarmthState] = useState<number>(() => getActiveAlbumVal('customWarmth', 0.0));
  const [photos, setPhotos] = useState<Photo[]>(() => {
    const saved = localStorage.getItem('doiphoto_cloud_album');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>({
    brand: 'Sony',
    model: 'Alpha 7 IV (Virtual)',
    battery: 88,
    connectionType: 'Simulator',
    status: 'Idle'
  });
  const [activePreset, setActivePresetState] = useState<string>('wedding');
  const [isAutoRetouchEnabled, setIsAutoRetouchEnabledState] = useState<boolean>(true);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  // Advanced Features State
  const [uploadMode, setUploadMode] = useState<'auto' | 'starred' | 'manual'>('auto');
  const [reviewerMode, setReviewerModeState] = useState<boolean>(false);
  const [watermarkText, setWatermarkTextState] = useState<string>('Do\'i picture');
  const [watermarkTextLine1, setWatermarkTextLine1State] = useState<string>('The Wedding of');
  const [watermarkTextLine2, setWatermarkTextLine2State] = useState<string>('Bella & Thoyyib');
  const [watermarkTextLine3, setWatermarkTextLine3State] = useState<string>('07 June 2026');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.9);
  const [watermarkSize, setWatermarkSize] = useState<number>(28);
  const [watermarkType, setWatermarkTypeState] = useState<'none' | 'text' | 'image' | 'both'>(() => getActiveAlbumVal('watermarkType', 'both'));
  const [watermarkImage, setWatermarkImageState] = useState<string | null>(null);
  const [watermarkFont, setWatermarkFontState] = useState<string>('Outfit');
  const [watermarkFontLine1, setWatermarkFontLine1State] = useState<string>(() => getActiveAlbumVal('watermarkFontLine1', 'Outfit'));
  const [watermarkFontLine2, setWatermarkFontLine2State] = useState<string>(() => getActiveAlbumVal('watermarkFontLine2', 'Great Vibes'));
  const [watermarkFontLine3, setWatermarkFontLine3State] = useState<string>(() => getActiveAlbumVal('watermarkFontLine3', 'Outfit'));
  const [watermarkFramePreset, setWatermarkFramePresetState] = useState<string>(() => getActiveAlbumVal('watermarkFramePreset', 'rose_gold_floral'));
  const [guestSelfie, setGuestSelfie] = useState<string | null>(null);

  // Multi-Album States
  const [albums, setAlbums] = useState<Album[]>(() => {
    const savedAlbums = localStorage.getItem('doiphoto_albums');
    let currentAlbums: Album[] = [];
    if (savedAlbums) {
      try {
        currentAlbums = JSON.parse(savedAlbums);
      } catch {
        // ignore
      }
    }

    // Migration: upgrade old albums that still have watermarkFramePreset = 'none'
    // so that the preview shows the banner by default on first upgrade
    let migrated = false;
    currentAlbums = currentAlbums.map(album => {
      if (!album.watermarkFramePreset || album.watermarkFramePreset === 'none') {
        migrated = true;
        return {
          ...album,
          watermarkFramePreset: 'rose_gold_floral',
          watermarkType: 'both' as const,
          watermarkTextLine1: album.watermarkTextLine1 || 'The Wedding of',
          watermarkTextLine2: album.watermarkTextLine2 || 'Bella & Thoyyib',
          watermarkTextLine3: album.watermarkTextLine3 || '07 June 2026',
          watermarkFontLine1: album.watermarkFontLine1 || 'Outfit',
          watermarkFontLine2: album.watermarkFontLine2 || 'Great Vibes',
          watermarkFontLine3: album.watermarkFontLine3 || 'Outfit',
        };
      }
      return album;
    });
    if (migrated) {
      try { localStorage.setItem('doiphoto_albums', JSON.stringify(currentAlbums)); } catch { /* ignore */ }
    }
    

    if (currentAlbums.length === 0) {
      currentAlbums = [
        {
          id: 'album-demo',
          name: 'The Wedding Bella & Thoyyib',
          createdAt: Date.now() - 86400000,
          gdriveLink: '',
          watermarkType: 'both',
          watermarkText: "Do'i picture",
          watermarkImage: null,
          watermarkFont: 'Outfit',
          watermarkFramePreset: 'rose_gold_floral',
          watermarkTextLine1: 'The Wedding of',
          watermarkTextLine2: 'Bella & Thoyyib',
          watermarkTextLine3: '07 June 2026',
          watermarkFontLine1: 'Outfit',
          watermarkFontLine2: 'Great Vibes',
          watermarkFontLine3: 'Outfit',
          activePreset: 'wedding',
          isAutoRetouchEnabled: true,
          reviewerMode: false
        }
      ];
      localStorage.setItem('doiphoto_albums', JSON.stringify(currentAlbums));
    }
    return currentAlbums;
  });
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(() => {
    return localStorage.getItem('doiphoto_active_album_id');
  });
  
  const [isFacialSmoothingEnabled, setIsFacialSmoothingEnabled] = useState<boolean>(true);
  const [isPlateBlurringEnabled, setIsPlateBlurringEnabled] = useState<boolean>(false);
  const [isBlurryFilterEnabled, setIsBlurryFilterEnabled] = useState<boolean>(true);
  
  const [isTeamStreamActive, setIsTeamStreamActive] = useState<boolean>(false);
  const [teamPhotographers] = useState<Photographer[]>([
    { name: 'Cartein (Anda)', camera: 'Sony A7 IV', isOnline: true, lastActive: 'Aktif sekarang' },
    { name: 'Aris', camera: 'Canon EOS R6', isOnline: true, lastActive: 'Aktif sekarang' },
    { name: 'Dina', camera: 'Nikon Z6 II', isOnline: false, lastActive: '12 menit lalu' }
  ]);

  // Authentication & Google Drive states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('doiphoto_is_logged_in') === 'true';
  });
  const [gdriveLink, setGDriveLinkState] = useState<string>('');
  const [qrTargetMode, setQrTargetMode] = useState<'gallery' | 'gdrive'>('gallery');

  const [serverUrl, setServerUrlState] = useState<string>(() => {
    return localStorage.getItem('doipicture_server_url') || 'http://localhost:8000';
  });
  const [adminToken, setAdminTokenState] = useState<string>(() => {
    return localStorage.getItem('doipicture_admin_token') || 'doipicture_admin_secret';
  });
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);

  const setServerUrl = (url: string) => {
    setServerUrlState(url);
    localStorage.setItem('doipicture_server_url', url);
  };

  const setAdminToken = (token: string) => {
    setAdminTokenState(token);
    localStorage.setItem('doipicture_admin_token', token);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (!serverUrl) {
        setIsServerConnected(false);
        return;
      }
      try {
        const res = await fetch(`${serverUrl}/api/health`);
        const data = await res.json();
        if (data && data.status === 'healthy') {
          setIsServerConnected(true);
        } else {
          setIsServerConnected(false);
        }
      } catch (err) {
        setIsServerConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  const setWatermarkText = (text: string) => {
    setWatermarkTextState(text);
    updateActiveAlbumProperty('watermarkText', text);
  };

  const setWatermarkTextLine1 = (text: string) => {
    setWatermarkTextLine1State(text);
    updateActiveAlbumProperty('watermarkTextLine1', text);
  };

  const setWatermarkTextLine2 = (text: string) => {
    setWatermarkTextLine2State(text);
    updateActiveAlbumProperty('watermarkTextLine2', text);
  };

  const setWatermarkTextLine3 = (text: string) => {
    setWatermarkTextLine3State(text);
    updateActiveAlbumProperty('watermarkTextLine3', text);
  };

  const setEventName = (name: string) => {
    setEventNameState(name);
    updateActiveAlbumProperty('name', name);
  };

  const setActivePreset = (preset: string) => {
    setActivePresetState(preset);
    updateActiveAlbumProperty('activePreset', preset);
  };

  const setIsAutoRetouchEnabled = (enabled: boolean) => {
    setIsAutoRetouchEnabledState(enabled);
    updateActiveAlbumProperty('isAutoRetouchEnabled', enabled);
  };

  const setReviewerMode = (enabled: boolean) => {
    setReviewerModeState(enabled);
    updateActiveAlbumProperty('reviewerMode', enabled);
  };

  const updateActiveAlbumProperty = <K extends keyof Album>(key: K, value: Album[K]) => {
    const activeId = localStorage.getItem('doiphoto_active_album_id');
    setAlbums(prev => {
      if (!activeId) return prev;
      const updated = prev.map(a => a.id === activeId ? { ...a, [key]: value } : a);
      try {
        localStorage.setItem('doiphoto_albums', JSON.stringify(updated));
      } catch (err) {
        console.error('Quota exceeded or storage failed:', err);
      }
      return updated;
    });

    if (isServerConnected && activeId) {
      fetch(`${serverUrl}/api/v1/albums/${activeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ [key]: value })
      }).catch(err => console.error('Failed to sync album update to server:', err));
    }
  };

  const setManualBrightness = (val: number) => {
    setManualBrightnessState(val);
    updateActiveAlbumProperty('manualBrightness', val);
  };
  const setManualContrast = (val: number) => {
    setManualContrastState(val);
    updateActiveAlbumProperty('manualContrast', val);
  };
  const setManualSaturation = (val: number) => {
    setManualSaturationState(val);
    updateActiveAlbumProperty('manualSaturation', val);
  };
  const setManualExposure = (val: number) => {
    setManualExposureState(val);
    updateActiveAlbumProperty('manualExposure', val);
  };
  const setManualWarmth = (val: number) => {
    setManualWarmthState(val);
    updateActiveAlbumProperty('manualWarmth', val);
  };
  const setCustomPresetName = (val: string | null) => {
    setCustomPresetNameState(val);
    updateActiveAlbumProperty('customPresetName', val);
  };
  const setCustomBrightness = (val: number) => {
    setCustomBrightnessState(val);
    updateActiveAlbumProperty('customBrightness', val);
  };
  const setCustomContrast = (val: number) => {
    setCustomContrastState(val);
    updateActiveAlbumProperty('customContrast', val);
  };
  const setCustomSaturation = (val: number) => {
    setCustomSaturationState(val);
    updateActiveAlbumProperty('customSaturation', val);
  };
  const setCustomExposure = (val: number) => {
    setCustomExposureState(val);
    updateActiveAlbumProperty('customExposure', val);
  };
  const setCustomWarmth = (val: number) => {
    setCustomWarmthState(val);
    updateActiveAlbumProperty('customWarmth', val);
  };

  // Set Google Drive link with localStorage sync
  const setGDriveLink = (link: string) => {
    setGDriveLinkState(link);
    updateActiveAlbumProperty('gdriveLink', link);
  };

  const setWatermarkType = (type: 'none' | 'text' | 'image' | 'both') => {
    setWatermarkTypeState(type);
    updateActiveAlbumProperty('watermarkType', type);
  };

  const setWatermarkImage = (image: string | null) => {
    setWatermarkImageState(image);
    updateActiveAlbumProperty('watermarkImage', image);
  };

  const setWatermarkFont = (font: string) => {
    setWatermarkFontState(font);
    updateActiveAlbumProperty('watermarkFont', font);
  };

  const setWatermarkFontLine1 = (font: string) => {
    setWatermarkFontLine1State(font);
    updateActiveAlbumProperty('watermarkFontLine1', font);
  };

  const setWatermarkFontLine2 = (font: string) => {
    setWatermarkFontLine2State(font);
    updateActiveAlbumProperty('watermarkFontLine2', font);
  };

  const setWatermarkFontLine3 = (font: string) => {
    setWatermarkFontLine3State(font);
    updateActiveAlbumProperty('watermarkFontLine3', font);
  };

  const setWatermarkFramePreset = (preset: string) => {
    setWatermarkFramePresetState(preset);
    updateActiveAlbumProperty('watermarkFramePreset', preset);
  };

  // Mock Authentication Functions
  const login = (email: string, pass: string): boolean => {
    if (email === 'admin@doipicture.com' && pass === 'admin123') {
      setIsLoggedIn(true);
      localStorage.setItem('doiphoto_is_logged_in', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('doiphoto_is_logged_in');
  };

  // Load photos, coins, auth and gdrive on mount
  useEffect(() => {
    const saved = localStorage.getItem('doiphoto_cloud_album');
    let hasSavedPhotos = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          hasSavedPhotos = true;
        }
      } catch {
        // ignore
      }
    }

    if (hasSavedPhotos) return;

    // Process initial stock photos asynchronously
    const loadStock = async () => {
      const INITIAL_STOCK_PHOTOS = [
        {
          id: 'stock-1',
          name: 'DSC_3092.JPG',
          originalUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop', 
          preset: 'wedding',
          category: 'Resepsi' as const,
          shutterCount: 3092,
          faceIds: [1],
          albumId: 'album-demo',
          metadata: { cameraBrand: 'Sony', cameraModel: 'ILCE-7M4', aperture: 'f/1.8', shutterSpeed: '1/250s', iso: '100', focalLength: '85mm' }
        },
        {
          id: 'stock-2',
          name: 'DSC_3104.JPG',
          originalUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop', 
          preset: 'cinematic',
          category: 'Akad' as const,
          shutterCount: 3104,
          faceIds: [2, 3],
          albumId: 'album-demo',
          metadata: { cameraBrand: 'Sony', cameraModel: 'ILCE-7M4', aperture: 'f/2.8', shutterSpeed: '1/160s', iso: '400', focalLength: '35mm' }
        },
        {
          id: 'stock-3',
          name: 'DSC_3118.JPG',
          originalUrl: 'https://images.unsplash.com/photo-1472691681358-fdf029eed0a5?q=80&w=600&auto=format&fit=crop', 
          preset: 'vivid',
          category: 'Photobooth' as const,
          shutterCount: 3118,
          faceIds: [1],
          albumId: 'album-demo',
          metadata: { cameraBrand: 'Canon', cameraModel: 'EOS R6', aperture: 'f/4.0', shutterSpeed: '1/1000s', iso: '800', focalLength: '200mm' }
        }
      ];

      const processedStock = await Promise.all(
        INITIAL_STOCK_PHOTOS.map(async (photo, index) => {
          try {
            const retouched = await applyAIRetouch(
              photo.originalUrl, 
              photo.preset,
              {
                text: watermarkText,
                opacity: watermarkOpacity,
                size: watermarkSize,
                smoothFace: isFacialSmoothingEnabled,
                blurPlates: isPlateBlurringEnabled,
                type: watermarkType,
                image: watermarkImage,
                font: watermarkFont,
                framePreset: watermarkFramePreset
              }
            );
            return {
              id: photo.id,
              name: photo.name,
              originalUrl: photo.originalUrl,
              url: retouched,
              timestamp: Date.now() - (3 - index) * 600000,
              preset: photo.preset,
              status: 'done' as const,
              shutterCount: photo.shutterCount,
              isStarred: false,
              category: photo.category,
              isApproved: true,
              editorStatus: 'Raw' as const,
              faceIds: photo.faceIds,
              albumId: photo.albumId,
              metadata: photo.metadata
            };
          } catch {
            return {
              id: photo.id,
              name: photo.name,
              originalUrl: photo.originalUrl,
              url: photo.originalUrl,
              timestamp: Date.now() - (3 - index) * 600000,
              preset: 'original',
              status: 'done' as const,
              shutterCount: photo.shutterCount,
              isStarred: false,
              category: photo.category,
              isApproved: true,
              editorStatus: 'Raw' as const,
              faceIds: photo.faceIds,
              albumId: photo.albumId,
              metadata: photo.metadata
            };
          }
        })
      );
      setPhotos(processedStock);
    };

    loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('doiphoto_cloud_album', JSON.stringify(photos));
  }, [photos]);



  // Load settings when entering a different album
  useEffect(() => {
    if (activeAlbumId) {
      const activeAlbum = albums.find(a => a.id === activeAlbumId);
      if (activeAlbum) {
        setTimeout(() => {
          setEventNameState(activeAlbum.name);
          setGDriveLinkState(activeAlbum.gdriveLink || '');
          setWatermarkTypeState(activeAlbum.watermarkType || 'text');
          setWatermarkTextState(activeAlbum.watermarkText || 'Do\'i picture');
          setWatermarkTextLine1State(activeAlbum.watermarkTextLine1 !== undefined ? activeAlbum.watermarkTextLine1 : 'The Wedding of');
          setWatermarkTextLine2State(activeAlbum.watermarkTextLine2 !== undefined ? activeAlbum.watermarkTextLine2 : 'Bella & Thoyyib');
          setWatermarkTextLine3State(activeAlbum.watermarkTextLine3 !== undefined ? activeAlbum.watermarkTextLine3 : '07 June 2026');
          setWatermarkImageState(activeAlbum.watermarkImage || null);
          setWatermarkFontState(activeAlbum.watermarkFont || 'Outfit');
          setWatermarkFontLine1State(activeAlbum.watermarkFontLine1 || 'Outfit');
          setWatermarkFontLine2State(activeAlbum.watermarkFontLine2 || 'Great Vibes');
          setWatermarkFontLine3State(activeAlbum.watermarkFontLine3 || 'Outfit');
          setWatermarkFramePresetState(activeAlbum.watermarkFramePreset || 'none');
          setActivePresetState(activeAlbum.activePreset || 'wedding');
          setIsAutoRetouchEnabledState(activeAlbum.isAutoRetouchEnabled !== undefined ? activeAlbum.isAutoRetouchEnabled : true);
          setReviewerModeState(activeAlbum.reviewerMode !== undefined ? activeAlbum.reviewerMode : false);

          // Load preset values
          setManualBrightnessState(activeAlbum.manualBrightness !== undefined ? activeAlbum.manualBrightness : 1.0);
          setManualContrastState(activeAlbum.manualContrast !== undefined ? activeAlbum.manualContrast : 1.0);
          setManualSaturationState(activeAlbum.manualSaturation !== undefined ? activeAlbum.manualSaturation : 1.0);
          setManualExposureState(activeAlbum.manualExposure !== undefined ? activeAlbum.manualExposure : 0.0);
          setManualWarmthState(activeAlbum.manualWarmth !== undefined ? activeAlbum.manualWarmth : 0.0);
          setCustomPresetNameState(activeAlbum.customPresetName !== undefined ? activeAlbum.customPresetName : null);
          setCustomBrightnessState(activeAlbum.customBrightness !== undefined ? activeAlbum.customBrightness : 1.0);
          setCustomContrastState(activeAlbum.customContrast !== undefined ? activeAlbum.customContrast : 1.0);
          setCustomSaturationState(activeAlbum.customSaturation !== undefined ? activeAlbum.customSaturation : 1.0);
          setCustomExposureState(activeAlbum.customExposure !== undefined ? activeAlbum.customExposure : 0.0);
          setCustomWarmthState(activeAlbum.customWarmth !== undefined ? activeAlbum.customWarmth : 0.0);
        }, 0);
      }
    }
  }, [activeAlbumId, albums]);

  // Sync albums from server
  useEffect(() => {
    if (!isServerConnected) return;
    const fetchAlbums = async () => {
      try {
        const res = await fetch(`${serverUrl}/api/v1/albums`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        if (res.ok) {
          const serverAlbums = await res.json();
          if (serverAlbums) {
            setAlbums(serverAlbums);
            localStorage.setItem('doiphoto_albums', JSON.stringify(serverAlbums));
            if (!activeAlbumId && serverAlbums.length > 0) {
              const lastId = localStorage.getItem('doiphoto_active_album_id');
              if (lastId && serverAlbums.some((a: any) => a.id === lastId)) {
                setActiveAlbumId(lastId);
              } else {
                setActiveAlbumId(serverAlbums[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync albums from server:', err);
      }
    };
    fetchAlbums();
  }, [isServerConnected, serverUrl, adminToken]);

  // Fetch and poll photos for the active album from the server
  useEffect(() => {
    if (!isServerConnected || !activeAlbumId) return;

    const fetchPhotos = async () => {
      try {
        const res = await fetch(`${serverUrl}/api/v1/photos?album_id=${activeAlbumId}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        if (res.ok) {
          const serverPhotos = await res.json();
          setPhotos(prev => {
            const localUploadingProcessing = prev.filter(p => p.albumId === activeAlbumId && (p.status === 'uploading' || p.status === 'processing'));
            const finishedPhotoIds = new Set(localUploadingProcessing.map(p => p.id));
            const filteredServerPhotos = serverPhotos.filter((p: Photo) => !finishedPhotoIds.has(p.id));
            const combined = [...localUploadingProcessing, ...filteredServerPhotos];
            return combined.sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      } catch (err) {
        console.error('Failed to poll photos from server:', err);
      }
    };

    fetchPhotos();
    const interval = setInterval(fetchPhotos, 5000);
    return () => clearInterval(interval);
  }, [isServerConnected, serverUrl, adminToken, activeAlbumId]);

  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1] || 'image/jpeg';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const addPhoto = async (
    base64OrUrl: string, 
    name?: string, 
    metadata?: Photo['metadata'],
    options?: { category?: Photo['category']; isStarred?: boolean }
  ) => {
    const newId = `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fileName = name || `DSC_${Math.floor(1000 + Math.random() * 8999)}.JPG`;
    const match = fileName.match(/\d+/);
    const shutterNum = parseInt(match ? match[0] : '1001');
    const photoCategory = options?.category || 'Akad';
    const isPhotoStarred = options?.isStarred || false;



    const generatedFaceIds: number[] = [];
    if (Math.random() > 0.3) generatedFaceIds.push(1);
    if (Math.random() > 0.5) generatedFaceIds.push(2);
    if (Math.random() > 0.7) generatedFaceIds.push(3);

    const newPhoto: Photo = {
      id: newId,
      name: fileName,
      originalUrl: base64OrUrl,
      url: base64OrUrl, 
      timestamp: Date.now(),
      preset: isAutoRetouchEnabled ? activePreset : 'original',
      status: 'uploading',
      shutterCount: shutterNum,
      isStarred: isPhotoStarred,
      category: photoCategory,
      isApproved: !reviewerMode,
      editorStatus: 'Raw',
      faceIds: generatedFaceIds,
      albumId: activeAlbumId || '',
      metadata: {
        cameraBrand: metadata?.cameraBrand || cameraInfo?.brand || 'Unknown',
        cameraModel: metadata?.cameraModel || cameraInfo?.model || 'Unknown Device',
        aperture: metadata?.aperture || 'f/2.8',
        shutterSpeed: metadata?.shutterSpeed || '1/200s',
        iso: metadata?.iso || '200',
        focalLength: metadata?.focalLength || '50mm'
      }
    };

    setPhotos(prev => [newPhoto, ...prev]);

    await new Promise(resolve => setTimeout(resolve, 800));

    setPhotos(prev =>
      prev.map(p => (p.id === newId ? { ...p, status: 'processing' } : p))
    );

    try {
      const targetPreset = isAutoRetouchEnabled ? activePreset : 'original';
      const mSettings = targetPreset === 'custom'
        ? {
            brightness: customBrightness,
            contrast: customContrast,
            saturation: customSaturation,
            exposure: customExposure,
            warmth: customWarmth
          }
        : {
            brightness: manualBrightness,
            contrast: manualContrast,
            saturation: manualSaturation,
            exposure: manualExposure,
            warmth: manualWarmth
          };
      const retouchedUrl = await applyAIRetouch(
        base64OrUrl, 
        targetPreset,
        {
          text: watermarkText,
          opacity: watermarkOpacity,
          size: watermarkSize,
          smoothFace: isFacialSmoothingEnabled,
          blurPlates: isPlateBlurringEnabled,
          type: watermarkType,
          image: watermarkImage,
          font: watermarkFont,
          framePreset: watermarkFramePreset
        },
        mSettings
      );
      
      let finalPhotoUrl = retouchedUrl;
      let finalOriginalUrl = base64OrUrl;
      let serverPhotoId = newId;

      if (isServerConnected) {
        try {
          const blob = base64ToBlob(retouchedUrl);
          const formData = new FormData();
          formData.append('image', blob, fileName);
          formData.append('album_id', activeAlbumId || '');
          formData.append('camera_brand', newPhoto.metadata?.cameraBrand || '');
          formData.append('camera_model', newPhoto.metadata?.cameraModel || '');
          formData.append('category', photoCategory);
          formData.append('is_starred', isPhotoStarred.toString());
          formData.append('is_approved', (!reviewerMode).toString());
          formData.append(
            'metadata',
            JSON.stringify({
              aperture: newPhoto.metadata?.aperture,
              shutterSpeed: newPhoto.metadata?.shutterSpeed,
              iso: newPhoto.metadata?.iso,
              focalLength: newPhoto.metadata?.focalLength,
              cameraBrand: newPhoto.metadata?.cameraBrand,
              cameraModel: newPhoto.metadata?.cameraModel
            })
          );
          
          const uploadRes = await fetch(`${serverUrl}/api/v1/photos/upload`, {
            method: 'POST',
            headers: {
              'X-API-Key': adminToken
            },
            body: formData
          });
          
          if (uploadRes.ok) {
            const uploadedPhotoData = await uploadRes.json();
            finalPhotoUrl = uploadedPhotoData.url;
            finalOriginalUrl = uploadedPhotoData.originalUrl;
            serverPhotoId = uploadedPhotoData.id;
          } else {
            console.error('Server upload failed, falling back to local URL');
          }
        } catch (uploadErr) {
          console.error('Error uploading to server:', uploadErr);
        }
      }

      const finishedPhoto: Photo = {
        ...newPhoto,
        id: serverPhotoId,
        url: finalPhotoUrl,
        originalUrl: finalOriginalUrl,
        preset: targetPreset,
        status: 'done'
      };

      setPhotos(prev =>
        prev.map(p => (p.id === newId ? finishedPhoto : p))
      );

      setViewingPhoto(v => (v && (v.id === newId || v.id === serverPhotoId) ? finishedPhoto : v));

      return finishedPhoto;
    } catch (error) {
      console.error('Failed to apply AI retouch:', error);
      
      const failedPhoto: Photo = {
        ...newPhoto,
        status: 'done'
      };

      setPhotos(prev =>
        prev.map(p => (p.id === newId ? failedPhoto : p))
      );

      return failedPhoto;
    }
  };

  useEffect(() => {
    if (!isTeamStreamActive) return;

    const interval = setInterval(async () => {
      const mockNames = ['Aris', 'Dina'];
      const mockCameras = ['Canon EOS R6', 'Nikon Z6 II'];
      const shooterIdx = Math.floor(Math.random() * mockNames.length);
      const shooterName = mockNames[shooterIdx];
      const shooterCamera = mockCameras[shooterIdx];

      const categories = ['Akad', 'Resepsi', 'Photobooth'] as const;
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      const randomImg = SIMULATED_SHOT_IMAGES[Math.floor(Math.random() * SIMULATED_SHOT_IMAGES.length)];
      const fileNumber = Math.floor(4000 + Math.random() * 5999);
      const filename = `${shooterName === 'Aris' ? 'IMG' : 'DSC'}_${fileNumber}.JPG`;

      await addPhoto(
        randomImg, 
        filename, 
        {
          aperture: 'f/2.8',
          shutterSpeed: '1/320s',
          iso: '400',
          focalLength: '70mm',
          cameraBrand: shooterName === 'Aris' ? 'Canon' : 'Nikon',
          cameraModel: shooterCamera
        },
        {
          category: randomCategory,
          isStarred: Math.random() > 0.75
        }
      );
    }, 12000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeamStreamActive, activePreset, watermarkText, watermarkOpacity, watermarkSize, watermarkType, watermarkImage, watermarkFont, watermarkFramePreset, isFacialSmoothingEnabled, isPlateBlurringEnabled, reviewerMode]);

  const updatePhotoPreset = async (id: string, presetName: string) => {
    setPhotos(prev =>
      prev.map(p => (p.id === id ? { ...p, status: 'processing', preset: presetName } : p))
    );

    try {
      const targetPhoto = photos.find(p => p.id === id);
      if (!targetPhoto) return;

      const mSettings = presetName === 'custom'
        ? {
            brightness: customBrightness,
            contrast: customContrast,
            saturation: customSaturation,
            exposure: customExposure,
            warmth: customWarmth
          }
        : {
            brightness: manualBrightness,
            contrast: manualContrast,
            saturation: manualSaturation,
            exposure: manualExposure,
            warmth: manualWarmth
          };

      const retouchedUrl = await applyAIRetouch(
        targetPhoto.originalUrl, 
        presetName,
        {
          text: watermarkText,
          opacity: watermarkOpacity,
          size: watermarkSize,
          smoothFace: isFacialSmoothingEnabled,
          blurPlates: isPlateBlurringEnabled,
          type: watermarkType,
          image: watermarkImage,
          font: watermarkFont,
          framePreset: watermarkFramePreset
        },
        mSettings
      );
      
      setPhotos(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, url: retouchedUrl, preset: presetName, status: 'done' }
            : p
        )
      );

      setViewingPhoto(v =>
        v && v.id === id
          ? { ...v, url: retouchedUrl, preset: presetName, status: 'done' }
          : v
      );

      if (isServerConnected) {
        try {
          await fetch(`${serverUrl}/api/v1/photos/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              url: retouchedUrl,
              preset: presetName
            })
          });
        } catch (err) {
          console.error('Failed to sync photo preset update to server:', err);
        }
      }
    } catch (error) {
      console.error('Failed to update photo preset:', error);
      setPhotos(prev =>
        prev.map(p => (p.id === id ? { ...p, status: 'done' } : p))
      );
    }
  };

  const toggleStarPhoto = (id: string) => {
    let targetStarred = false;
    setPhotos(prev =>
      prev.map(p => {
        if (p.id === id) {
          targetStarred = !p.isStarred;
          return { ...p, isStarred: targetStarred };
        }
        return p;
      })
    );
    if (isServerConnected) {
      fetch(`${serverUrl}/api/v1/photos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isStarred: targetStarred })
      }).catch(err => console.error('Failed to sync star status to server:', err));
    }
  };

  const toggleReviewStatus = (id: string, approved: boolean) => {
    setPhotos(prev =>
      prev.map(p => (p.id === id ? { ...p, isApproved: approved } : p))
    );
    if (isServerConnected) {
      fetch(`${serverUrl}/api/v1/photos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isApproved: approved })
      }).catch(err => console.error('Failed to sync review status to server:', err));
    }
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (viewingPhoto?.id === id) {
      setViewingPhoto(null);
    }
    if (isServerConnected) {
      fetch(`${serverUrl}/api/v1/photos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }).catch(err => console.error('Failed to delete photo from server:', err));
    }
  };

  const clearPhotos = () => {
    setPhotos(prev => prev.filter(p => p.albumId !== activeAlbumId));
    setViewingPhoto(null);
  };

  const createAlbum = (name: string): string => {
    const newId = `album-${Date.now()}`;
    const newAlbum: Album = {
      id: newId,
      name: name,
      createdAt: Date.now(),
      gdriveLink: '',
      watermarkType: 'text',
      watermarkText: 'Do\'i picture',
      watermarkImage: null,
      watermarkFont: 'Outfit',
      activePreset: 'wedding',
      isAutoRetouchEnabled: true,
      reviewerMode: false
    };
    const updated = [...albums, newAlbum];
    setAlbums(updated);
    localStorage.setItem('doiphoto_albums', JSON.stringify(updated));

    if (isServerConnected) {
      fetch(`${serverUrl}/api/v1/albums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(newAlbum)
      }).catch(err => console.error('Failed to sync new album to server:', err));
    }

    return newId;
  };

  const selectAlbum = (id: string | null) => {
    setActiveAlbumId(id);
    if (id) {
      localStorage.setItem('doiphoto_active_album_id', id);
    } else {
      localStorage.removeItem('doiphoto_active_album_id');
    }
  };

  const deleteAlbum = (id: string) => {
    const updated = albums.filter(a => a.id !== id);
    setAlbums(updated);
    localStorage.setItem('doiphoto_albums', JSON.stringify(updated));
    setPhotos(prev => prev.filter(p => p.albumId !== id));
    if (activeAlbumId === id) {
      selectAlbum(null);
    }

    if (isServerConnected) {
      fetch(`${serverUrl}/api/v1/albums/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }).catch(err => console.error('Failed to sync delete album to server:', err));
    }
  };

  const connectCamera = (info: CameraInfo) => {
    setCameraInfo(info);
  };

  const disconnectCamera = () => {
    setCameraInfo(null);
  };

  const setCameraStatus = (status: CameraInfo['status']) => {
    setCameraInfo(prev => (prev ? { ...prev, status } : null));
  };

  return (
    <CloudContext.Provider
      value={{
        activeTab,
        setActiveTab,
        eventName,
        setEventName,
        addPhoto,
        updatePhotoPreset,
        toggleStarPhoto,
        toggleReviewStatus,
        deletePhoto,
        clearPhotos,
        cameraInfo,
        connectCamera,
        disconnectCamera,
        setCameraStatus,
        activePreset,
        setActivePreset,
        isAutoRetouchEnabled,
        setIsAutoRetouchEnabled,
        viewingPhoto,
        setViewingPhoto,
        
        // Advanced Features
        uploadMode,
        setUploadMode,
        reviewerMode,
        setReviewerMode,
        watermarkText,
        setWatermarkText,
        watermarkOpacity,
        setWatermarkOpacity,
        watermarkSize,
        setWatermarkSize,
        watermarkType,
        setWatermarkType,
        watermarkImage,
        setWatermarkImage,
        watermarkFont,
        setWatermarkFont,
        watermarkTextLine1,
        setWatermarkTextLine1,
        watermarkTextLine2,
        setWatermarkTextLine2,
        watermarkTextLine3,
        setWatermarkTextLine3,
        watermarkFontLine1,
        setWatermarkFontLine1,
        watermarkFontLine2,
        setWatermarkFontLine2,
        watermarkFontLine3,
        setWatermarkFontLine3,
        watermarkFramePreset,
        setWatermarkFramePreset,
        guestSelfie,
        setGuestSelfie,
        isFacialSmoothingEnabled,
        setIsFacialSmoothingEnabled,
        isPlateBlurringEnabled,
        setIsPlateBlurringEnabled,
        isBlurryFilterEnabled,
        setIsBlurryFilterEnabled,
        teamPhotographers,
        isTeamStreamActive,
        setIsTeamStreamActive,

        // New Preset Option Settings
        manualBrightness,
        setManualBrightness,
        manualContrast,
        setManualContrast,
        manualSaturation,
        setManualSaturation,
        manualExposure,
        setManualExposure,
        manualWarmth,
        setManualWarmth,
        customPresetName,
        setCustomPresetName,
        customBrightness,
        setCustomBrightness,
        customContrast,
        setCustomContrast,
        customSaturation,
        setCustomSaturation,
        customExposure,
        setCustomExposure,
        customWarmth,
        setCustomWarmth,

        // Authentication & GDrive Integration
        isLoggedIn,
        login,
        logout,
        gdriveLink,
        setGDriveLink,
        qrTargetMode,
        setQrTargetMode,

        // Multi-Album API
        albums,
        activeAlbumId,
        createAlbum,
        selectAlbum,
        deleteAlbum,
        photos: photos.filter(p => p.albumId === activeAlbumId),
        allPhotos: photos,
        theme,
        toggleTheme,
        serverUrl,
        setServerUrl,
        adminToken,
        setAdminToken,
        isServerConnected,
        setIsServerConnected
      }}
    >
      {children}
    </CloudContext.Provider>
  );
};

export const useCloud = () => {
  const context = useContext(CloudContext);
  if (!context) {
    throw new Error('useCloud must be used within a CloudProvider');
  }
  return context;
};
