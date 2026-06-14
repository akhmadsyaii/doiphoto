from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Photo Metadata sub-schema
class PhotoMetadata(BaseModel):
    aperture: Optional[str] = ""
    shutterSpeed: Optional[str] = ""
    iso: Optional[str] = ""
    focalLength: Optional[str] = ""
    cameraBrand: Optional[str] = ""
    cameraModel: Optional[str] = ""

# Photo Schemas
class PhotoBase(BaseModel):
    name: str
    preset: str = "none"
    status: str = "done"
    shutterCount: int = 0
    isStarred: bool = False
    category: str = "Akad"
    isApproved: bool = True
    editorStatus: str = "Raw"
    albumId: str

class PhotoCreate(PhotoBase):
    id: str
    originalUrl: str
    url: str
    faceIds: Optional[List[int]] = []
    cameraBrand: Optional[str] = ""
    cameraModel: Optional[str] = ""
    aperture: Optional[str] = ""
    shutterSpeed: Optional[str] = ""
    iso: Optional[str] = ""
    focalLength: Optional[str] = ""

class PhotoUpdate(BaseModel):
    preset: Optional[str] = None
    status: Optional[str] = None
    isStarred: Optional[bool] = None
    category: Optional[str] = None
    isApproved: Optional[bool] = None
    editorStatus: Optional[str] = None
    url: Optional[str] = None

class PhotoResponse(BaseModel):
    id: str
    name: str
    originalUrl: str
    url: str
    timestamp: float
    preset: str
    status: str
    shutterCount: int
    isStarred: bool
    category: str
    isApproved: bool
    editorStatus: str
    faceIds: List[int]
    albumId: str
    metadata: PhotoMetadata

    class Config:
        from_attributes = True

# Album Schemas
class AlbumBase(BaseModel):
    name: str
    gdriveLink: Optional[str] = ""
    watermarkType: Optional[str] = "none"
    watermarkText: Optional[str] = ""
    watermarkImage: Optional[str] = None
    watermarkFont: Optional[str] = "Outfit"
    watermarkFramePreset: Optional[str] = "none"
    watermarkTextLine1: Optional[str] = ""
    watermarkTextLine2: Optional[str] = ""
    watermarkTextLine3: Optional[str] = ""
    watermarkFontLine1: Optional[str] = "Outfit"
    watermarkFontLine2: Optional[str] = "Outfit"
    watermarkFontLine3: Optional[str] = "Outfit"
    activePreset: Optional[str] = "none"
    isAutoRetouchEnabled: Optional[bool] = False
    reviewerMode: Optional[bool] = False
    manualBrightness: Optional[float] = 100.0
    manualContrast: Optional[float] = 100.0
    manualSaturation: Optional[float] = 100.0
    manualExposure: Optional[float] = 100.0
    manualWarmth: Optional[float] = 100.0
    customPresetName: Optional[str] = None
    customBrightness: Optional[float] = 100.0
    customContrast: Optional[float] = 100.0
    customSaturation: Optional[float] = 100.0
    customExposure: Optional[float] = 100.0
    customWarmth: Optional[float] = 100.0

class AlbumCreate(AlbumBase):
    id: str

class AlbumUpdate(BaseModel):
    name: Optional[str] = None
    gdriveLink: Optional[str] = None
    watermarkType: Optional[str] = None
    watermarkText: Optional[str] = None
    watermarkImage: Optional[str] = None
    watermarkFont: Optional[str] = None
    watermarkFramePreset: Optional[str] = None
    watermarkTextLine1: Optional[str] = None
    watermarkTextLine2: Optional[str] = None
    watermarkTextLine3: Optional[str] = None
    watermarkFontLine1: Optional[str] = None
    watermarkFontLine2: Optional[str] = None
    watermarkFontLine3: Optional[str] = None
    activePreset: Optional[str] = None
    isAutoRetouchEnabled: Optional[bool] = None
    reviewerMode: Optional[bool] = None
    manualBrightness: Optional[float] = None
    manualContrast: Optional[float] = None
    manualSaturation: Optional[float] = None
    manualExposure: Optional[float] = None
    manualWarmth: Optional[float] = None
    customPresetName: Optional[str] = None
    customBrightness: Optional[float] = None
    customContrast: Optional[float] = None
    customSaturation: Optional[float] = None
    customExposure: Optional[float] = None
    customWarmth: Optional[float] = None

class AlbumResponse(AlbumBase):
    id: str
    createdAt: float
    photos: List[PhotoResponse] = []

    class Config:
        from_attributes = True

# Device Schemas
class DeviceRegister(BaseModel):
    name: str

class DeviceResponse(BaseModel):
    id: str
    name: str
    apiKey: str
    createdAt: str

    class Config:
        from_attributes = True
