import os
import json
import uuid
import shutil
import urllib.request
import urllib.parse
import io
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from PIL.ExifTags import TAGS
from fractions import Fraction
import base64

import models
import schemas
import auth
import drive
from database import engine, get_db

# ==========================================
# HELPERS (EXIF PARSER & QR STANDEE SHEET GENERATOR)
# ==========================================

def apply_backend_retouch(temp_file_path: str, album) -> str:
    """
    Applies filters (presets) and watermarks to the image at temp_file_path.
    Saves the processed image to a new temp path and returns its path.
    """
    import base64
    import io
    import os
    import urllib.request
    from PIL import Image, ImageDraw, ImageFont, ImageEnhance
    import drive
    
    # 1. Open the original image
    try:
        img = Image.open(temp_file_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening image for backend retouch: {e}")
        return temp_file_path
        
    width, height = img.size
    
    # Constrain maximum size for speed (similar to client side maxDim = 1200)
    max_dim = 1200
    if width > max_dim or height > max_dim:
        if width > height:
            new_height = int((height * max_dim) / width)
            new_width = max_dim
        else:
            new_width = int((width * max_dim) / height)
            new_height = max_dim
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        width, height = img.size

    # 2. Apply preset/retouch if auto retouch is enabled
    preset_name = album.activePreset or "none"
    is_auto = album.isAutoRetouchEnabled
    
    brightness = 1.0
    contrast = 1.0
    saturation = 1.0
    exposure = 0.0
    warmth = 0.0
    
    if is_auto:
        if preset_name == "wedding":
            brightness = 1.06
            contrast = 0.94
            saturation = 1.08
            warmth = 0.2
        elif preset_name == "sports":
            brightness = 1.03
            contrast = 1.22
            saturation = 1.30
        elif preset_name == "cinematic":
            brightness = 0.98
            contrast = 1.15
            saturation = 0.92
            warmth = 0.1
        elif preset_name == "monochrome":
            img = img.convert("L").convert("RGBA")
            brightness = 0.96
            contrast = 1.35
            saturation = 0.0
        elif preset_name in ["custom", "manual"]:
            brightness = (album.manualBrightness or 100.0) / 100.0
            contrast = (album.manualContrast or 100.0) / 100.0
            saturation = (album.manualSaturation or 100.0) / 100.0
            exposure = (album.manualExposure or 100.0) / 100.0 - 1.0
            warmth = (album.manualWarmth or 100.0) / 100.0 - 1.0
            
    # Apply brightness/exposure
    net_brightness = brightness * (1.0 + exposure * 0.2)
    if net_brightness != 1.0:
        img = ImageEnhance.Brightness(img).enhance(net_brightness)
        
    # Apply contrast
    if contrast != 1.0:
        img = ImageEnhance.Contrast(img).enhance(contrast)
        
    # Apply saturation
    if saturation != 1.0:
        img = ImageEnhance.Color(img).enhance(saturation)
        
    # Apply warmth tint
    if warmth != 0.0:
        tint_layer = Image.new("RGBA", img.size)
        if warmth > 0:
            tint_color = (253, 186, 116, int(warmth * 0.25 * 255))
        else:
            tint_color = (147, 197, 253, int(abs(warmth) * 0.25 * 255))
        
        draw_tint = ImageDraw.Draw(tint_layer)
        draw_tint.rectangle([0, 0, width, height], fill=tint_color)
        img = Image.alpha_composite(img, tint_layer)

    # 3. Draw Watermark image overlay
    watermark_type = album.watermarkType or "none"
    watermark_img_uri = album.watermarkImage
    frame_preset = album.watermarkFramePreset or "none"
    
    if watermark_type in ["image", "both"] or frame_preset == "custom":
        if watermark_img_uri:
            try:
                watermark_img = None
                if watermark_img_uri.startswith("data:image"):
                    _, b64_data = watermark_img_uri.split(";base64,", 1)
                    image_bytes = base64.b64decode(b64_data)
                    watermark_img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
                elif watermark_img_uri.startswith("http://") or watermark_img_uri.startswith("https://"):
                    req = urllib.request.Request(watermark_img_uri, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=10) as response:
                        watermark_data = response.read()
                    watermark_img = Image.open(io.BytesIO(watermark_data)).convert("RGBA")
                else:
                    local_path = watermark_img_uri
                    if "static/" in local_path:
                        local_path = local_path.split("static/")[-1]
                        local_path = os.path.join(drive.LOCAL_STATIC_DIR, local_path)
                    if os.path.exists(local_path):
                        watermark_img = Image.open(local_path).convert("RGBA")
                
                if watermark_img:
                    watermark_img = watermark_img.resize((width, height), Image.Resampling.LANCZOS)
                    img = Image.alpha_composite(img, watermark_img)
            except Exception as e:
                print(f"Error applying custom watermark image: {e}")

    # Draw built-in frames if selected
    if frame_preset != "none" and frame_preset != "custom":
        def get_bottom_banner_height(preset: str, h: int) -> int:
            preset_heights = {
                'polaroid': 0.15,
                'wedding_gold': 0.18,
                'botanical': 0.18,
                'minimal_black': 0.15,
                'retro_film': 0.14,
                'midnight_luxury': 0.20,
                'neon_glow': 0.15,
                'soft_vignette': 0.18,
                'silver_sparkles': 0.16,
                'rose_gold_floral': 0.35,
                'vintage_paper': 0.18,
                'cyberpunk_grid': 0.16,
                'cherry_blossom': 0.18,
                'luxury_marble': 0.18,
                'christmas_holiday': 0.18
            }
            return int(h * preset_heights.get(preset, 0.0))
            
        banner_h = get_bottom_banner_height(frame_preset, height)
        if banner_h > 0:
            banner_top = height - banner_h
            frame_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(frame_layer)
            
            # Simple color matching for frames
            if frame_preset == 'polaroid':
                banner_color = (255, 255, 255, 224)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
                draw.line([0, banner_top, width, banner_top], fill=(15, 23, 42, 20), width=1)
            elif frame_preset == 'wedding_gold':
                banner_color = (252, 244, 220, 230)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
                draw.line([0, banner_top, width, banner_top], fill=(194, 120, 3, 220), width=2)
                draw.line([0, banner_top + 4, width, banner_top + 4], fill=(194, 120, 3, 220), width=1)
            elif frame_preset == 'rose_gold_floral':
                banner_color = (186, 45, 85, 230)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            elif frame_preset == 'minimal_black':
                banner_color = (30, 41, 59, 220)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            elif frame_preset == 'retro_film':
                banner_color = (15, 23, 42, 230)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            elif frame_preset == 'midnight_luxury':
                banner_color = (15, 23, 42, 240)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            elif frame_preset == 'neon_glow':
                banner_color = (6, 182, 212, 220)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            elif frame_preset == 'botanical':
                banner_color = (240, 245, 240, 230)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            elif frame_preset == 'vintage_paper':
                banner_color = (245, 235, 215, 230)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            elif frame_preset == 'cherry_blossom':
                banner_color = (253, 244, 245, 230)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
            else:
                banner_color = (255, 255, 255, 224)
                draw.rectangle([0, banner_top, width, height], fill=banner_color)
                
            img = Image.alpha_composite(img, frame_layer)

    # 4. Draw Text Watermark
    if watermark_type in ["text", "both"]:
        lines = []
        if album.watermarkTextLine1 or album.watermarkTextLine2 or album.watermarkTextLine3:
            lines = [
                album.watermarkTextLine1 or "",
                album.watermarkTextLine2 or "",
                album.watermarkTextLine3 or ""
            ]
            lines = [l for l in lines if l.strip()]
        else:
            lines = (album.watermarkText or "").split('\n')
            lines = [l for l in lines if l.strip()]
            
        if lines:
            text_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(text_layer)
            
            text_color = (255, 255, 255, 230)
            if frame_preset in ['polaroid', 'wedding_gold', 'botanical', 'vintage_paper', 'cherry_blossom']:
                if frame_preset == 'polaroid':
                    text_color = (30, 41, 59, 230)
                elif frame_preset == 'wedding_gold':
                    text_color = (120, 53, 15, 230)
                else:
                    text_color = (30, 41, 59, 230)
            
            font_size = 28
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except Exception:
                font = ImageFont.load_default()
                
            banner_h = int(height * 0.15) if frame_preset != "none" else 0
            if banner_h > 0:
                center_y = height - banner_h // 2
                draw_y = center_y - (len(lines) * font_size) // 2
                for line in lines:
                    try:
                        w = draw.textlength(line, font=font)
                    except AttributeError:
                        w = len(line) * (font_size * 0.6)
                    draw.text((width // 2 - w // 2, draw_y), line, fill=text_color, font=font)
                    draw_y += font_size + 4
            else:
                draw_y = height - 24 - len(lines) * (font_size + 4)
                for line in lines:
                    try:
                        w = draw.textlength(line, font=font)
                    except AttributeError:
                        w = len(line) * (font_size * 0.6)
                    draw.text((width - 24 - w, draw_y), line, fill=text_color, font=font)
                    draw_y += font_size + 4
                    
            img = Image.alpha_composite(img, text_layer)

    root, ext = os.path.splitext(temp_file_path)
    processed_file_path = f"{root}_processed{ext}"
    img.convert("RGB").save(processed_file_path, "JPEG", quality=85)
    return processed_file_path

def parse_exif_metadata(file_path: str) -> dict:
    metadata = {
        "cameraBrand": "",
        "cameraModel": "",
        "aperture": "",
        "shutterSpeed": "",
        "iso": "",
        "focalLength": ""
    }
    try:
        with Image.open(file_path) as img:
            exif = img._getexif()
            if exif:
                exif_data = {}
                for tag, value in exif.items():
                    decoded = TAGS.get(tag, tag)
                    exif_data[decoded] = value
                
                # Brand & Model
                brand = exif_data.get("Make", "")
                if brand:
                    metadata["cameraBrand"] = str(brand).strip()
                
                model = exif_data.get("Model", "")
                if model:
                    metadata["cameraModel"] = str(model).strip()
                
                # ISO
                iso = exif_data.get("ISOSpeedRatings", "")
                if iso:
                    if isinstance(iso, (list, tuple)):
                        iso = iso[0]
                    metadata["iso"] = str(iso)
                
                # Aperture (FNumber)
                fnumber = exif_data.get("FNumber", "")
                if fnumber:
                    try:
                        val = float(fnumber)
                        metadata["aperture"] = f"f/{val:.1f}".replace(".0", "")
                    except Exception:
                        metadata["aperture"] = f"f/{fnumber}"
                
                # Shutter Speed (ExposureTime)
                exposure = exif_data.get("ExposureTime", "")
                if exposure:
                    try:
                        frac = Fraction(exposure).limit_denominator()
                        if frac.numerator == 1:
                            metadata["shutterSpeed"] = f"1/{frac.denominator}s"
                        elif frac > 1:
                            metadata["shutterSpeed"] = f"{float(frac):.1f}s".replace(".0", "")
                        else:
                            metadata["shutterSpeed"] = f"{frac}s"
                    except Exception:
                        metadata["shutterSpeed"] = f"{exposure}s"
                
                # Focal Length
                focal = exif_data.get("FocalLength", "")
                if focal:
                    try:
                        val = float(focal)
                        metadata["focalLength"] = f"{int(val)}mm"
                    except Exception:
                        metadata["focalLength"] = f"{focal}mm"
    except Exception as e:
        print(f"Error parsing EXIF: {e}")
    return metadata

def draw_camera_icon(draw, x: int, y: int, size: int = 40, color: tuple = (22, 119, 255)):
    body_w = size
    body_h = int(size * 0.65)
    body_x = x
    body_y = y + int(size * 0.25)
    
    lens_r = int(body_h * 0.35)
    lens_cx = body_x + int(body_w / 2)
    lens_cy = body_y + int(body_h / 2)
    
    bump_w = int(size * 0.3)
    bump_h = int(size * 0.15)
    bump_x = body_x + int((body_w - bump_w) / 2)
    bump_y = y + int(size * 0.1)
    
    draw.rectangle([bump_x, bump_y, bump_x + bump_w, bump_y + bump_h], fill=color)
    draw.rounded_rectangle([body_x, body_y, body_x + body_w, body_y + body_h], radius=int(size*0.1), fill=color)
    draw.ellipse([lens_cx - lens_r, lens_cy - lens_r, lens_cx + lens_r, lens_cy + lens_r], fill=(255, 255, 255))
    inner_r = int(lens_r * 0.6)
    draw.ellipse([lens_cx - inner_r, lens_cy - inner_r, lens_cx + inner_r, lens_cy + inner_r], fill=color)

def draw_corner_branding(img, text: str = "do'ipicture"):
    w, h = img.size
    draw = ImageDraw.Draw(img)
    
    font_path = None
    for p in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
    ]:
        if os.path.exists(p):
            font_path = p
            break
            
    if font_path:
        font = ImageFont.truetype(font_path, 20)
        font_title = ImageFont.truetype(font_path, 42)
        font_link = ImageFont.truetype(font_path, 24)
    else:
        font = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_link = ImageFont.load_default()
        
    color = (22, 119, 255)
    text_color = (38, 38, 38)
    
    pad_x = 60
    pad_y = 60
    
    # Top Left
    draw_camera_icon(draw, pad_x, pad_y, 30, color)
    draw.text((pad_x + 40, pad_y + 2), text, fill=text_color, font=font)
    
    # Top Right
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
    except Exception:
        text_w = len(text) * 12
    draw_camera_icon(draw, w - pad_x - text_w - 50, pad_y, 30, color)
    draw.text((w - pad_x - text_w, pad_y + 2), text, fill=text_color, font=font)
    
    # Bottom Left
    draw_camera_icon(draw, pad_x, h - pad_y - 35, 30, color)
    draw.text((pad_x + 40, h - pad_y - 33), text, fill=text_color, font=font)
    
    # Bottom Right
    draw_camera_icon(draw, w - pad_x - text_w - 50, h - pad_y - 35, 30, color)
    draw.text((w - pad_x - text_w, h - pad_y - 33), text, fill=text_color, font=font)
    
    return font_title, font_link

def generate_qr_sheet(album_name: str, guest_link: str) -> io.BytesIO:
    w, h = 1000, 1400
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    font_title, font_link = draw_corner_branding(img)
    
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=500x500&data={urllib.parse.quote(guest_link)}"
    try:
        req = urllib.request.Request(qr_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            qr_data = response.read()
            qr_img = Image.open(io.BytesIO(qr_data)).convert("RGB")
    except Exception as e:
        print(f"Failed to fetch QR image: {e}")
        qr_img = Image.new("RGB", (500, 500), (240, 240, 240))
        qr_draw = ImageDraw.Draw(qr_img)
        qr_draw.text((150, 240), "QR Code Unavailable", fill=(0, 0, 0))
        
    qr_img = qr_img.resize((500, 500))
    qr_x = int((w - 500) / 2)
    qr_y = int((h - 500) / 2) + 50
    img.paste(qr_img, (qr_x, qr_y))
    
    draw.rectangle([qr_x - 10, qr_y - 10, qr_x + 510, qr_y + 510], outline=(230, 230, 230), width=3)
    
    display_name = album_name
    if len(display_name) > 30:
        display_name = display_name[:28] + "..."
        
    try:
        bbox = draw.textbbox((0, 0), display_name, font=font_title)
        title_w = bbox[2] - bbox[0]
    except Exception:
        title_w = len(display_name) * 25
        
    title_x = int((w - title_w) / 2)
    title_y = qr_y - 120
    draw.text((title_x, title_y), display_name, fill=(22, 119, 255), font=font_title)
    
    display_link = guest_link.replace("https://", "").replace("http://", "")
    try:
        bbox = draw.textbbox((0, 0), display_link, font=font_link)
        link_w = bbox[2] - bbox[0]
    except Exception:
        link_w = len(display_link) * 14
        
    link_x = int((w - link_w) / 2)
    link_y = qr_y + 540
    
    draw.rounded_rectangle([link_x - 20, link_y - 10, link_x + link_w + 20, link_y + 35], radius=8, fill=(240, 245, 255))
    draw.text((link_x, link_y - 2), display_link, fill=(89, 89, 89), font=font_link)
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


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

# ASGI middleware to handle Traefik /api strip-prefix routing compatibility
class ApiPrefixMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            if not path.startswith("/api") and not path.startswith("/static"):
                scope["path"] = "/api" + path
        await self.app(scope, receive, send)

app.add_middleware(ApiPrefixMiddleware)

# Temp upload directory
TEMP_UPLOAD_DIR = "/tmp/doipicture"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# Mount local static folder for Google Drive fallback mode
app.mount("/api/static", StaticFiles(directory=drive.LOCAL_STATIC_DIR), name="static_api")
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
    processed: Optional[bool] = Form(False),
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
        
    # Extract EXIF metadata from the file
    exif_meta = parse_exif_metadata(temp_file_path)
        
    # Load metadata parameters
    meta_dict = {}
    try:
        if metadata:
            meta_dict = json.loads(metadata)
    except Exception:
        pass
        
    # Setup album folder on Google Drive
    root_folder_id = os.getenv("GDRIVE_ROOT_FOLDER_ID", "")
    album_folder_id = drive.get_or_create_album_folder(album.name, root_folder_id)
    server_url = str(request.base_url)

    temp_processed_path = temp_file_path
    
    if not processed:
        try:
            temp_processed_path = apply_backend_retouch(temp_file_path, album)
        except Exception as pe:
            print(f"Error in backend retouching: {pe}")
            temp_processed_path = temp_file_path

    # If processed is False, upload the original raw file separately
    if not processed:
        orig_filename = f"raw_{final_name}"
        orig_view_url, orig_download_url = drive.upload_to_drive(
            temp_file_path, orig_filename, album_folder_id, server_url
        )
    else:
        orig_view_url, orig_download_url = "", ""

    # Upload the processed file
    view_url, download_url = drive.upload_to_drive(
        temp_processed_path, final_name, album_folder_id, server_url
    )
    
    # Clean up temp files
    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)
    if temp_processed_path != temp_file_path and os.path.exists(temp_processed_path):
        os.remove(temp_processed_path)
        
    if not view_url:
        raise HTTPException(status_code=500, detail="Failed to upload and store image")

    # Set final URLs
    final_original_url = orig_download_url if (not processed and orig_download_url) else download_url

    # Create database entry
    new_photo = models.Photo(
        id=photo_id,
        name=os.path.splitext(final_name)[0],
        originalUrl=final_original_url,
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
        cameraBrand=exif_meta.get("cameraBrand") or camera_brand or meta_dict.get("cameraBrand", ""),
        cameraModel=exif_meta.get("cameraModel") or camera_model or meta_dict.get("cameraModel", ""),
        aperture=exif_meta.get("aperture") or meta_dict.get("aperture", ""),
        shutterSpeed=exif_meta.get("shutterSpeed") or meta_dict.get("shutterSpeed", ""),
        iso=exif_meta.get("iso") or meta_dict.get("iso", ""),
        focalLength=exif_meta.get("focalLength") or meta_dict.get("focalLength", "")
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

@app.get("/api/v1/albums/{album_id}/qr-sheet")
def get_album_qr_sheet(album_id: str, request: Request, db: Session = Depends(get_db)):
    album = db.query(models.Album).filter(models.Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    base = str(request.base_url).rstrip('/')
    base = base.replace("/api", "")
    guest_link = f"{base}/?view=gallery&albumId={album_id}"
    
    try:
        buf = generate_qr_sheet(album.name, guest_link)
        return StreamingResponse(
            buf,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=qr_sheet_{album_id}.png",
                "Cache-Control": "no-cache"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR Standee Sheet: {str(e)}")

