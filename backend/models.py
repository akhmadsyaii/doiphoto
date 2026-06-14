from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Album(Base):
    __tablename__ = "albums"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    createdAt = Column(Float, default=lambda: datetime.utcnow().timestamp())
    gdriveLink = Column(String, default="")
    
    # Watermark settings
    watermarkType = Column(String, default="none")  # none, text, image, both
    watermarkText = Column(String, default="")
    watermarkImage = Column(String, nullable=True)
    watermarkFont = Column(String, default="Outfit")
    watermarkFramePreset = Column(String, default="none")
    
    # 3-Line Watermark
    watermarkTextLine1 = Column(String, default="")
    watermarkTextLine2 = Column(String, default="")
    watermarkTextLine3 = Column(String, default="")
    watermarkFontLine1 = Column(String, default="Outfit")
    watermarkFontLine2 = Column(String, default="Outfit")
    watermarkFontLine3 = Column(String, default="Outfit")
    
    # Preset & Retouch Settings
    activePreset = Column(String, default="none")
    isAutoRetouchEnabled = Column(Boolean, default=False)
    reviewerMode = Column(Boolean, default=False)
    
    # Manual Adjustments
    manualBrightness = Column(Float, default=100)
    manualContrast = Column(Float, default=100)
    manualSaturation = Column(Float, default=100)
    manualExposure = Column(Float, default=100)
    manualWarmth = Column(Float, default=100)
    
    # Custom Preset
    customPresetName = Column(String, nullable=True)
    customBrightness = Column(Float, default=100)
    customContrast = Column(Float, default=100)
    customSaturation = Column(Float, default=100)
    customExposure = Column(Float, default=100)
    customWarmth = Column(Float, default=100)

    # Relationships
    photos = relationship("Photo", back_populates="album", cascade="all, delete-orphan")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    originalUrl = Column(String)  # GD original photo URL
    url = Column(String)           # GD processed/active photo URL
    timestamp = Column(Float, default=lambda: datetime.utcnow().timestamp())
    preset = Column(String, default="none")
    status = Column(String, default="done")  # uploading, processing, done, failed
    shutterCount = Column(Integer, default=0)
    isStarred = Column(Boolean, default=False)
    category = Column(String, default="Akad")  # Akad, Resepsi, Photobooth
    isApproved = Column(Boolean, default=True)
    editorStatus = Column(String, default="Raw")  # Raw, Needs Editor, Edited
    faceIds = Column(String, default="[]")  # Stored as JSON serialized array

    albumId = Column(String, ForeignKey("albums.id", ondelete="CASCADE"), nullable=False)
    
    # EXIF and Camera Info
    cameraBrand = Column(String, default="")
    cameraModel = Column(String, default="")
    aperture = Column(String, default="")
    shutterSpeed = Column(String, default="")
    iso = Column(String, default="")
    focalLength = Column(String, default="")

    # Relationships
    album = relationship("Album", back_populates="photos")

class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    apiKeyHash = Column(String, unique=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    lastActiveAt = Column(DateTime, default=datetime.utcnow)
