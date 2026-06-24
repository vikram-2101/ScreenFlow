from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.screenshot import Screenshot
from app.core.config import settings

from app.services.ocr import extract_text
from app.services.content_extractor import extract_content
from app.services.filename import generate_smart_filename
from app.utils.file_ops import move_to_category

from sqlalchemy.sql import func
import os


def resolve_upload_path(file_path: str) -> str:
    """
    Returns the absolute path on disk for a stored file_path.
    Handles three formats that may exist in the DB:
      - bare filename:           "uuid.png"
      - relative with uploads:  "uploads/uuid.png" or "./uploads/uuid.png"
      - relative category path: "2026/06/document/name.png"
    Always returns: settings.UPLOAD_DIR + the path stripped of any leading uploads prefix.
    """
    upload_dir = settings.UPLOAD_DIR.strip("./")  # normalise: "uploads"

    # Strip any leading occurrence of the upload dir so we never double it
    normalised = file_path.replace("\\", "/")
    for prefix in (f"./{upload_dir}/", f"{upload_dir}/"):
        if normalised.startswith(prefix):
            normalised = normalised[len(prefix):]
            break

    return os.path.join(settings.UPLOAD_DIR, normalised)



@celery_app.task(bind=True, max_retries=3)
def process_screenshot(self, screenshot_id: str):
    db = SessionLocal()

    try:
        # 1️⃣ Fetch screenshot row
        screenshot = (
            db.query(Screenshot)
            .filter(Screenshot.id == screenshot_id)
            .first()
        )

        if not screenshot:
            return

        # 2️⃣ OCR — resolve the absolute path (handles any legacy path format in DB)
        abs_file_path = resolve_upload_path(screenshot.file_path)
        text = extract_text(abs_file_path)

        # 3️⃣ Gemini extraction — single call returns full metadata
        #    (category, subcategory, title, summary, tags, confidence, date)
        #    rule-based classifier removed; Gemini is the single source of truth
        data = extract_content(category="unknown", text=text)

        category    = data.get("category", "other").lower()
        subcategory = data.get("subcategory", "")
        summary     = data.get("summary", "")
        tags        = data.get("tags", [])
        confidence  = float(data.get("confidence", 0.0))
        title       = data.get("title", "screenshot")
        date_str    = data.get("date")

        # 4️⃣ Smart filename generation (uses title + date from Gemini)
        smart_name = generate_smart_filename(category, {"title": title, "date": date_str})

        # 5️⃣ Move file into organised folder structure
        new_path = move_to_category(
            abs_file_path,   # pass absolute source path
            category,
            smart_name,
            date_str=date_str,
        )

        # 6️⃣ Persist everything to the database
        screenshot.smart_filename     = smart_name
        screenshot.file_path          = new_path
        screenshot.extracted_text     = text
        screenshot.category           = category
        screenshot.subcategory        = subcategory
        screenshot.summary            = summary
        screenshot.tags               = tags
        screenshot.confidence         = confidence
        screenshot.status             = "COMPLETED"
        screenshot.completed_at       = func.now()

        db.commit()

    except Exception as e:
        # ❌ Failure path
        screenshot.status = "FAILED"
        screenshot.error_message = str(e)
        db.commit()

        raise self.retry(exc=e, countdown=5)

    finally:
        db.close()