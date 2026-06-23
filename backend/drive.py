import os
import logging
from typing import Tuple, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("doipicture.drive")

SCOPES = ['https://www.googleapis.com/auth/drive']

# Look in several locations for credentials
CREDENTIALS_LOCATIONS = [
    "/app/credentials.json",
    "/etc/doipicture/credentials.json",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "credentials.json")
]

credentials_path = None
for path in CREDENTIALS_LOCATIONS:
    if os.path.exists(path):
        credentials_path = path
        break

# Determine if Google Drive should run in fallback mode
is_fallback_mode = False
if credentials_path:
    logger.info(f"Using Google Drive credentials at: {credentials_path}")
else:
    logger.warning("Google Drive credentials.json NOT found. Running in local storage fallback mode!")
    is_fallback_mode = True

# Create local storage folders for fallback mode
if os.path.exists("/app"):
    LOCAL_STATIC_DIR = "/app/static"
else:
    LOCAL_STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(LOCAL_STATIC_DIR, exist_ok=True)


def get_drive_service():
    if is_fallback_mode:
        return None
    try:
        creds = service_account.Credentials.from_service_account_file(
            credentials_path, scopes=SCOPES
        )
        return build('drive', 'v3', credentials=creds)
    except Exception as e:
        logger.error(f"Failed to initialize Google Drive service: {e}. Falling back to local storage.")
        return None


def get_or_create_album_folder(album_name: str, root_folder_id: Optional[str] = None) -> str:
    """
    Find or create a folder with the album name inside the root folder.
    Returns the Google Drive Folder ID, or album_name if in fallback mode.
    """
    service = get_drive_service()
    if not service or not root_folder_id:
        logger.info(f"Local storage fallback: Using album name '{album_name}' as directory.")
        # Create local directory for the album
        album_dir = os.path.join(LOCAL_STATIC_DIR, album_name)
        os.makedirs(album_dir, exist_ok=True)
        return album_name

    try:
        # Search for folder
        query = f"name='{album_name}' and '{root_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields='files(id,name)').execute()
        files = results.get('files', [])
        
        if files:
            return files[0]['id']
            
        # Create folder if it doesn't exist
        file_metadata = {
            'name': album_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [root_folder_id]
        }
        folder = service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')
    except Exception as e:
        logger.error(f"Error creating/fetching Google Drive folder for {album_name}: {e}")
        # Return fallback local folder name
        return album_name


def upload_to_drive(file_path: str, filename: str, folder_or_album_id: str, server_url: str = "") -> Tuple[str, str]:
    """
    Upload file to Google Drive.
    Returns a tuple (view_url, download_url) or local server URLs if in fallback mode.
    """
    service = get_drive_service()
    
    # Check if we are using local fallback
    # In fallback mode, folder_or_album_id represents the local album folder name
    if not service:
        # Move file from temp path to static path
        album_dir = os.path.join(LOCAL_STATIC_DIR, folder_or_album_id)
        os.makedirs(album_dir, exist_ok=True)
        
        dest_path = os.path.join(album_dir, filename)
        import shutil
        shutil.copy2(file_path, dest_path)
        
        # Build local URLs
        # Example: https://doiphoto.likhita.my.id/api/static/album_name/filename.jpg
        public_url = os.getenv("COOLIFY_URL") or os.getenv("PUBLIC_URL")
        if public_url:
            base_url = public_url.rstrip('/')
            local_url = f"{base_url}/static/{folder_or_album_id}/{filename}"
        else:
            base_url = server_url.rstrip('/') if server_url else "http://localhost:8000"
            if base_url.endswith("/api"):
                local_url = f"{base_url}/static/{folder_or_album_id}/{filename}"
            else:
                local_url = f"{base_url}/api/static/{folder_or_album_id}/{filename}"
        logger.info(f"Local file saved: {dest_path} -> Available at {local_url}")
        return local_url, local_url

    try:
        file_metadata = {
            'name': filename,
            'parents': [folder_or_album_id]
        }
        media = MediaFileUpload(file_path, mimetype='image/jpeg', resumable=True)
        
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id,webContentLink,webViewLink'
        ).execute()
        
        file_id = file.get('id')
        
        # Grant public read permissions to the file
        try:
            permission = {
                'type': 'anyone',
                'role': 'reader',
            }
            service.permissions().create(
                fileId=file_id,
                body=permission
            ).execute()
        except Exception as pe:
            logger.warning(f"Could not set public permissions on file {file_id}: {pe}")
            
        # webViewLink is the link to view in Google Drive
        # webContentLink is the direct download link
        view_link = file.get('webViewLink')
        download_link = file.get('webContentLink')
        
        logger.info(f"Uploaded successfully to Google Drive. File ID: {file_id}")
        return view_link, download_link
        
    except Exception as e:
        logger.error(f"Error uploading file {filename} to Google Drive: {e}")
        # Fall back to returning local URL if Drive upload fails mid-way
        return "", ""
