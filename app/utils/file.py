import uuid
import os
import hashlib
from app.core.config import settings


def compute_file_hash(file_bytes: bytes) -> str:
    """Returns the SHA-256 hex digest of the given bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


def save_upload_file(upload_file) -> tuple[str, str]:
    """
    Saves the uploaded file to UPLOAD_DIR.
    Returns: (relative_file_id, sha256_hash)
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    file_bytes = upload_file.file.read()
    file_hash = compute_file_hash(file_bytes)

    file_id = f"{uuid.uuid4()}.png"
    file_path = os.path.join(settings.UPLOAD_DIR, file_id)

    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)

    # Return relative path (just the filename) and the hash
    return file_id, file_hash