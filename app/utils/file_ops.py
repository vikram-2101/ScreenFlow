import os
import shutil
from datetime import datetime
from app.core.config import settings


def move_to_category(source_abs_path: str, category: str, new_name: str, date_str: str = None) -> str:
    """
    Moves a file into the organised upload folder structure.

    Args:
        source_abs_path: The FULL absolute (or resolved relative) path to the source file.
                         Caller is responsible for resolving this — do NOT pass a bare DB path.
        category:        Category name (used as subfolder).
        new_name:        Smart filename without extension.
        date_str:        Optional YYYY-MM-DD string; defaults to today.

    Returns:
        Relative path from UPLOAD_DIR (suitable for storing in DB).
        e.g. "2026/06/document/2026-06-02_resume_vikram.png"
    """
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d") if date_str else datetime.now()
    except ValueError:
        dt = datetime.now()

    year  = dt.strftime("%Y")
    month = dt.strftime("%m")

    # Relative folder structure inside UPLOAD_DIR
    relative_dir = os.path.join(year, month, category.lower())

    # Absolute destination directory
    abs_dest_dir = os.path.join(settings.UPLOAD_DIR, relative_dir)
    os.makedirs(abs_dest_dir, exist_ok=True)

    extension = os.path.splitext(source_abs_path)[1] or ".png"

    # Relative path to store in DB
    relative_new_path = os.path.join(relative_dir, f"{new_name}{extension}").replace("\\", "/")

    # Absolute destination path
    abs_dest_path = os.path.join(settings.UPLOAD_DIR, relative_new_path)

    shutil.move(source_abs_path, abs_dest_path)

    return relative_new_path