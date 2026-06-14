import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variables for testing
os.environ["ADMIN_TOKEN"] = "test_admin_token"
os.environ["GDRIVE_ROOT_FOLDER_ID"] = "test_gdrive_folder"

from database import Base, get_db
from main import app
import auth

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the database dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_admin_auth():
    # Test without token
    response = client.get("/api/v1/albums")
    assert response.status_code == 403

    # Test with invalid token
    response = client.get(
        "/api/v1/albums",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 403

    # Test with valid token
    response = client.get(
        "/api/v1/albums",
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200

def test_device_registration_and_auth():
    # Register device as admin
    response = client.post(
        "/api/v1/devices/register",
        json={"name": "Test iPhone 14"},
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "apiKey" in data
    device_api_key = data["apiKey"]

    # Verify device can call endpoints requiring device authentication
    # Registering is not permitted for device, must return 403
    response = client.get(
        "/api/v1/devices",
        headers={"X-API-Key": device_api_key}
    )
    assert response.status_code == 403

    # Create album using admin
    response = client.post(
        "/api/v1/albums",
        json={
            "id": "test-album",
            "name": "Wedding of Alice & Bob",
            "watermarkType": "text"
        },
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200

    # Try uploading a mock photo with device credentials
    # Create a small dummy file
    import io
    dummy_image = io.BytesIO(b"dummy image data")
    
    response = client.post(
        "/api/v1/photos/upload",
        data={
            "album_id": "test-album",
            "camera_brand": "Canon",
            "camera_model": "EOS M3",
            "metadata": '{"aperture":"f/2.8","shutterSpeed":"1/200s"}'
        },
        files={"image": ("test.jpg", dummy_image, "image/jpeg")},
        headers={"X-API-Key": device_api_key}
    )
    # Since we don't have real credentials, it might fall back to local storage
    # and succeed, or mock Google Drive and succeed.
    # In fallback mode, it saves local file and returns 200.
    assert response.status_code == 200
    photo_data = response.json()
    assert photo_data["metadata"]["cameraModel"] == "EOS M3"
    assert photo_data["albumId"] == "test-album"

def test_album_and_photo_crud():
    # 1. Create Album
    response = client.post(
        "/api/v1/albums",
        json={
            "id": "album-1",
            "name": "Graduation Day 2026",
            "activePreset": "wedding"
        },
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200

    # 2. Update Album Watermark config
    response = client.patch(
        "/api/v1/albums/album-1",
        json={"watermarkText": "Custom Grad Logo"},
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200
    assert response.json()["watermarkText"] == "Custom Grad Logo"

    # 3. List Albums
    response = client.get(
        "/api/v1/albums",
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 1

    # 4. Upload photo
    import io
    dummy_image = io.BytesIO(b"dummy photo content")
    response = client.post(
        "/api/v1/photos/upload",
        data={"album_id": "album-1", "name": "graduation"},
        files={"image": ("graduation.jpg", dummy_image, "image/jpeg")},
        headers={"X-API-Key": "test_admin_token"} # Admin token as key fallback works
    )
    assert response.status_code == 200
    photo_id = response.json()["id"]


    # 4.1. Try uploading the same photo again (idempotence check)
    dummy_image_dup = io.BytesIO(b"another dummy photo content")
    response_dup = client.post(
        "/api/v1/photos/upload",
        data={"album_id": "album-1", "name": "graduation"},
        files={"image": ("graduation.jpg", dummy_image_dup, "image/jpeg")},
        headers={"X-API-Key": "test_admin_token"}
    )
    assert response_dup.status_code == 200
    assert response_dup.json()["id"] == photo_id


    # 5. List photos
    response = client.get(
        "/api/v1/photos?album_id=album-1",
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 1

    # 6. Star photo
    response = client.patch(
        f"/api/v1/photos/{photo_id}",
        json={"isStarred": True},
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200
    assert response.json()["isStarred"] is True

    # 7. Get Guest Gallery (Public Endpoint)
    response = client.get("/api/v1/gallery/album-1")
    assert response.status_code == 200
    assert response.json()["albumName"] == "Graduation Day 2026"
    assert len(response.json()["photos"]) == 1

    # 8. Delete photo
    response = client.delete(
        f"/api/v1/photos/{photo_id}",
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200

    # 9. Delete Album
    response = client.delete(
        "/api/v1/albums/album-1",
        headers={"Authorization": "Bearer test_admin_token"}
    )
    assert response.status_code == 200
