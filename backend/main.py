import os
import json
import uuid
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models
import schemas
import auth
import drive
from database import engine, get_db

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DoiPicture API",
    description="Backend API for DoiPicture photo capture, sharing, and Google Drive upload.",
    version="1.0.0"
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temp upload directory
TEMP_UPLOAD_DIR = "/tmp/doipicture"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# Mount local static folder for Google Drive fallback mode
app.mount("/static", StaticFiles(directory=drive.LOCAL_STATIC_DIR), name="static")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "drive_fallback_mode": drive.is_fallback_mode
    }

# ==========================================
# ALBUM ENDPOINTS
# ==========================================

@app.get("/api/v1/albums", response_model=List[schemas.AlbumResponse])
def list_albums(db: Session = Depends(get_db), current_user = Depends(auth.verify_admin_or_device)):
    return db.query(models.Album).all()

@app.get("/api/v1/albums/{album_id}", response_model=schemas.AlbumResponse)
def get_album(album_id: str, db: Session = Depends(get_db)):
    album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    # SQLite stored faceIds as JSON string, parse it before returning
    for photo in album.photos:
        try:
            photo.faceIds = json.loads(photo.faceIds)
        except Exception:
            photo.faceIds = []
            
    return album

@app.post("/api/v1/albums", response_model=schemas.AlbumResponse)
def create_album(album_data: schemas.AlbumCreate, db: Session = Depends(get_db), current_user = Depends(auth.verify_admin)):
    db_album = db.query(models.Album).filter(models.Album.id == album_data.id).first()
    if db_album:
        # Update existing album configs (upsert behaviour to support sync)
        for key, value in album_data.model_dump().items():
            setattr(db_album, key, value)
        db.commit()
        db.refresh(db_album)
        return db_album

    # Create a new album
    new_album = models.Album(**album_data.model_dump())
    db.add(new_album)
    db.commit()
    db.refresh(new_album)
    return new_album

@app.patch("/api/v1/albums/{album_id}", response_model=schemas.AlbumResponse)
def update_album(
    album_id: str,
    album_update: schemas.AlbumUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(auth.verify_admin)
):
    album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    for key, value in album_update.model_dump(exclude_unset=True).items():
        setattr(album, key, value)
        
    db.commit()
    db.refresh(album)
    return album

@app.delete("/api/v1/albums/{album_id}")
def delete_album(album_id: str, db: Session = Depends(get_db), current_user = Depends(auth.verify_admin)):
    album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    db.delete(album)
    db.commit()
    return {"message": f"Album {album_id} and all its photos deleted successfully"}

# ==========================================
# DEVICE ENDPOINTS
# ==========================================

@app.get("/api/v1/devices", response_model=List[schemas.DeviceResponse])
def get_devices(db: Session = Depends(get_db), current_user = Depends(auth.verify_admin)):
    devices = db.query(models.Device).all()
    # We do not return hashes to users
    res = []
    for d in devices:
        res.append({
            "id": d.id,
            "name": d.name,
            "apiKey": "dp_********************",  # Mask key
            "createdAt": d.createdAt.isoformat()
        })
    return res

@app.post("/api/v1/devices/register", response_model=schemas.DeviceResponse)
def register_device(
    device_data: schemas.DeviceRegister,
    db: Session = Depends(get_db),
    current_user = Depends(auth.verify_admin)
):
    raw_api_key = auth.generate_api_key()
    hashed_key = auth.hash_api_key(raw_api_key)
    
    device_id = str(uuid.uuid4())
    new_device = models.Device(
        id=device_id,
        name=device_data.name,
        apiKeyHash=hashed_key,
        createdAt=datetime.utcnow(),
        lastActiveAt=datetime.utcnow()
    )
    
    db.add(new_device)
    db.commit()
    
    return {
        "id": device_id,
        "name": device_data.name,
        "apiKey": raw_api_key,  # Tampilkan sekali saja ke admin
        "createdAt": new_device.createdAt.isoformat()
    }

@app.delete("/api/v1/devices/{device_id}")
def delete_device(
    device_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(auth.verify_admin)
):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    db.delete(device)
    db.commit()
    return {"message": f"Device {device_id} deleted successfully"}

# ==========================================
# PHOTO UPLOAD & MANAGEMENT ENDPOINTS
# ==========================================

@app.post("/api/v1/photos/upload", response_model=schemas.PhotoResponse)
async def upload_photo(
    request: Request,
    image: UploadFile = File(...),
    album_id: str = Form(...),
    camera_brand: Optional[str] = Form(""),
    camera_model: Optional[str] = Form(""),
    metadata: Optional[str] = Form("{}"),
    name: Optional[str] = Form(None),
    category: Optional[str] = Form("Akad"),
    is_starred: Optional[bool] = Form(False),
    is_approved: Optional[bool] = Form(True),
    db: Session = Depends(get_db),
    device = Depends(auth.verify_admin_or_device)
):
    # Verify album exists
    album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail=f"Album '{album_id}' not found")
        
    # Clean name and handle idempotency (prevent duplicates)
    db_name = name if name else os.path.splitext(image.filename)[0]
    existing_photo = db.query(models.Photo).filter(
        models.Photo.albumId == album_id,
        models.Photo.name == db_name
    ).first()
    if existing_photo:
        try:
            face_ids = json.loads(existing_photo.faceIds)
        except Exception:
            face_ids = []
            
        return {
            "id": existing_photo.id,
            "name": existing_photo.name,
            "originalUrl": existing_photo.originalUrl,
            "url": existing_photo.url,
            "timestamp": existing_photo.timestamp,
            "preset": existing_photo.preset,
            "status": existing_photo.status,
            "shutterCount": existing_photo.shutterCount,
            "isStarred": existing_photo.isStarred,
            "category": existing_photo.category,
            "isApproved": existing_photo.isApproved,
            "editorStatus": existing_photo.editorStatus,
            "faceIds": face_ids,
            "albumId": existing_photo.albumId,
            "metadata": schemas.PhotoMetadata(
                aperture=existing_photo.aperture,
                shutterSpeed=existing_photo.shutterSpeed,
                iso=existing_photo.iso,
                focalLength=existing_photo.focalLength,
                cameraBrand=existing_photo.cameraBrand,
                cameraModel=existing_photo.cameraModel
            )
        }

    # Generate ID and clean filename
    photo_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().timestamp()
    
    original_filename = image.filename
    ext = os.path.splitext(original_filename)[1] or ".jpg"
    final_name = name if name else f"img_{int(timestamp)}{ext}"
    if not final_name.endswith(ext):
        final_name += ext
        
    # Save file to temp path
    temp_file_path = os.path.join(TEMP_UPLOAD_DIR, f"{photo_id}{ext}")
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
        
    # Load metadata parameters
    meta_dict = {}
    try:
        if metadata:
            meta_dict = json.loads(metadata)
    except Exception:
        pass
        
    # Setup album folder on Google Drive
    # Use GDRIVE_ROOT_FOLDER_ID from environment
    root_folder_id = os.getenv("GDRIVE_ROOT_FOLDER_ID", "")
    
    # We resolve the album folder
    album_folder_id = drive.get_or_create_album_folder(album.name, root_folder_id)
    
    # Upload to Google Drive (or fallback to local folder)
    # We need server url for local fallback URLs
    # Use request.base_url dynamically so that local storage fallback URLs match current domain/IP
    server_url = str(request.base_url)
    view_url, download_url = drive.upload_to_drive(
        temp_file_path, final_name, album_folder_id, server_url
    )
    
    # Clean up temp file
    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)
        
    if not view_url:
        raise HTTPException(status_code=500, detail="Failed to upload and store image")

    # Create database entry
    new_photo = models.Photo(
        id=photo_id,
        name=os.path.splitext(final_name)[0],
        originalUrl=download_url,
        url=view_url,
        timestamp=timestamp,
        preset=album.activePreset or "none",
        status="done",
        shutterCount=0,
        isStarred=is_starred,
        category=category,
        isApproved=is_approved,
        editorStatus="Raw",
        faceIds="[]",
        albumId=album_id,
        cameraBrand=camera_brand or meta_dict.get("cameraBrand", ""),
        cameraModel=camera_model or meta_dict.get("cameraModel", ""),
        aperture=meta_dict.get("aperture", ""),
        shutterSpeed=meta_dict.get("shutterSpeed", ""),
        iso=meta_dict.get("iso", ""),
        focalLength=meta_dict.get("focalLength", "")
    )
    
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    
    # Format and parse JSON columns
    new_photo.faceIds = []
    
    # Construct response matching schema
    res_metadata = schemas.PhotoMetadata(
        aperture=new_photo.aperture,
        shutterSpeed=new_photo.shutterSpeed,
        iso=new_photo.iso,
        focalLength=new_photo.focalLength,
        cameraBrand=new_photo.cameraBrand,
        cameraModel=new_photo.cameraModel
    )
    
    return {
        "id": new_photo.id,
        "name": new_photo.name,
        "originalUrl": new_photo.originalUrl,
        "url": new_photo.url,
        "timestamp": new_photo.timestamp,
        "preset": new_photo.preset,
        "status": new_photo.status,
        "shutterCount": new_photo.shutterCount,
        "isStarred": new_photo.isStarred,
        "category": new_photo.category,
        "isApproved": new_photo.isApproved,
        "editorStatus": new_photo.editorStatus,
        "faceIds": [],
        "albumId": new_photo.albumId,
        "metadata": res_metadata
    }

@app.get("/api/v1/photos", response_model=List[schemas.PhotoResponse])
def get_photos(
    album_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(auth.verify_admin_or_device)
):
    query = db.query(models.Photo)
    if album_id:
        query = query.filter(models.Photo.albumId == album_id)
        
    photos = query.order_by(models.Photo.timestamp.desc()).all()
    
    res = []
    for photo in photos:
        try:
            face_ids = json.loads(photo.faceIds)
        except Exception:
            face_ids = []
            
        res.append({
            "id": photo.id,
            "name": photo.name,
            "originalUrl": photo.originalUrl,
            "url": photo.url,
            "timestamp": photo.timestamp,
            "preset": photo.preset,
            "status": photo.status,
            "shutterCount": photo.shutterCount,
            "isStarred": photo.isStarred,
            "category": photo.category,
            "isApproved": photo.isApproved,
            "editorStatus": photo.editorStatus,
            "faceIds": face_ids,
            "albumId": photo.albumId,
            "metadata": schemas.PhotoMetadata(
                aperture=photo.aperture,
                shutterSpeed=photo.shutterSpeed,
                iso=photo.iso,
                focalLength=photo.focalLength,
                cameraBrand=photo.cameraBrand,
                cameraModel=photo.cameraModel
            )
        })
    return res

@app.patch("/api/v1/photos/{photo_id}", response_model=schemas.PhotoResponse)
def update_photo(
    photo_id: str,
    photo_update: schemas.PhotoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(auth.verify_admin)
):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    for key, value in photo_update.model_dump(exclude_unset=True).items():
        setattr(photo, key, value)
        
    db.commit()
    db.refresh(photo)
    
    try:
        face_ids = json.loads(photo.faceIds)
    except Exception:
        face_ids = []
        
    return {
        "id": photo.id,
        "name": photo.name,
        "originalUrl": photo.originalUrl,
        "url": photo.url,
        "timestamp": photo.timestamp,
        "preset": photo.preset,
        "status": photo.status,
        "shutterCount": photo.shutterCount,
        "isStarred": photo.isStarred,
        "category": photo.category,
        "isApproved": photo.isApproved,
        "editorStatus": photo.editorStatus,
        "faceIds": face_ids,
        "albumId": photo.albumId,
        "metadata": schemas.PhotoMetadata(
            aperture=photo.aperture,
            shutterSpeed=photo.shutterSpeed,
            iso=photo.iso,
            focalLength=photo.focalLength,
            cameraBrand=photo.cameraBrand,
            cameraModel=photo.cameraModel
        )
    }

@app.delete("/api/v1/photos/{photo_id}")
def delete_photo(
    photo_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(auth.verify_admin)
):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    db.delete(photo)
    db.commit()
    return {"message": f"Photo {photo_id} deleted successfully"}

# ==========================================
# PUBLIC GUEST GALLERY ENDPOINT
# ==========================================

@app.get("/api/v1/gallery/{album_id}")
def get_guest_gallery(album_id: str, db: Session = Depends(get_db)):
    album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    # Get approved photos for this album
    photos = db.query(models.Photo).filter(
        models.Photo.albumId == album_id,
        models.Photo.isApproved == True
    ).order_by(models.Photo.timestamp.desc()).all()
    
    photo_list = []
    for p in photos:
        photo_list.append({
            "id": p.id,
            "name": p.name,
            "url": p.url,
            "originalUrl": p.originalUrl,
            "timestamp": p.timestamp,
            "isStarred": p.isStarred,
            "category": p.category
        })
        
    return {
        "albumName": album.name,
        "eventName": album.name,  # Fallback/alias
        "gdriveLink": album.gdriveLink,
        "photos": photo_list
    }
