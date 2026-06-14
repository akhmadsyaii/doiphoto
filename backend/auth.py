import os
import hashlib
import secrets
from typing import Optional
from fastapi import Security, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy.orm import Session
from starlette.status import HTTP_403_FORBIDDEN
from database import get_db
import models
from datetime import datetime

# Load admin token from environment
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "doipicture_admin_secret")

security_bearer = HTTPBearer(auto_error=False)
security_api_key = APIKeyHeader(name="X-API-Key", auto_error=False)

def generate_api_key() -> str:
    """Generate a secure random API key."""
    return f"dp_{secrets.token_urlsafe(32)}"

def hash_api_key(api_key: str) -> str:
    """Hash the API key using SHA-256."""
    return hashlib.sha256(api_key.encode()).hexdigest()

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    """Verify Bearer token matches the admin token."""
    if not credentials or credentials.credentials != ADMIN_TOKEN:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid or missing Admin Bearer Token"
        )
    return credentials.credentials

def verify_device(
    api_key: str = Security(security_api_key),
    db: Session = Depends(get_db)
):
    """Verify X-API-Key header matches a registered device."""
    if not api_key:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Forbidden: Missing X-API-Key header"
        )
        
    hashed_key = hash_api_key(api_key)
    device = db.query(models.Device).filter(models.Device.apiKeyHash == hashed_key).first()
    
    if not device:
        # Also check if it's the admin token being used as an API key for quick setup/debugging
        if api_key == ADMIN_TOKEN:
            return "admin"
            
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid X-API-Key"
        )
        
    # Update last active timestamp
    device.lastActiveAt = datetime.utcnow()
    db.commit()
    
    return device

def verify_admin_or_device(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    api_key: Optional[str] = Security(security_api_key),
    db: Session = Depends(get_db)
):
    """Verify credentials for either admin (Bearer or X-API-Key) or a registered device."""
    token = None
    
    # 1. Extract token from Bearer
    if credentials:
        token = credentials.credentials
        
    # 2. Extract token from X-API-Key if Bearer is not set
    if not token and api_key:
        token = api_key
        
    if not token:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="Forbidden: Missing Authorization Bearer Token or X-API-Key"
        )
        
    # 3. Check if it's the admin token
    if token == ADMIN_TOKEN:
        return "admin"
        
    # 4. Check if it's a registered device key
    hashed_key = hash_api_key(token)
    device = db.query(models.Device).filter(models.Device.apiKeyHash == hashed_key).first()
    
    if device:
        # Update last active timestamp
        device.lastActiveAt = datetime.utcnow()
        db.commit()
        return device
        
    raise HTTPException(
        status_code=HTTP_403_FORBIDDEN,
        detail="Forbidden: Invalid credentials"
    )

