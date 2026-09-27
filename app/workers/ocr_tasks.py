from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.screenshot import Screenshot
from app.models.category import Category
from app.core.config import settings

from pathlib import Path

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
    screenshot = None

    try:
        # 1️⃣ Fetch screenshot row
        screenshot = (
            db.query(Screenshot)
            .filter(Screenshot.id == screenshot_id)
            .first()
        )

        if not screenshot:
            return

        # 2️⃣ Resolve absolute path (handles any legacy path format in DB)
        abs_file_path = resolve_upload_path(screenshot.file_path)

        # 2b. OCR still runs — result stored in extracted_text for full-text search.
        #     It is NO LONGER the input to the naming pipeline; Gemini Vision
        #     reads the image directly and produces far better metadata.
        text = extract_text(abs_file_path)

        # 2c. Fetch user's existing categories so Gemini can reuse them
        if screenshot.user_id:
            user_categories = [c.name for c in db.query(Category).filter(Category.user_id == screenshot.user_id).all()]
        else:
            user_categories = [c.name for c in db.query(Category).filter(Category.session_id == screenshot.session_id).all()]

        # 3️⃣ Vision extraction — image → Gemini Vision → rich metadata
        #    ocr_text is passed only as a fallback input if the image can't load.
        data = extract_content(
            file_path=abs_file_path,
            ocr_text=text,
            user_categories=user_categories,
        )

        category    = data.get("category", "other").lower()
        subcategory = data.get("subcategory", "")
        summary     = data.get("summary", "")
        tags        = data.get("tags", [])
        confidence  = float(data.get("confidence", 0.0))
        title       = data.get("title", "screenshot")
        date_str    = data.get("date")

        # 4️⃣ Smart filename generation — YYYY-MM-DD_Category_Title
        #    Extension is stripped here; move_to_category re-attaches it.
        file_ext = Path(abs_file_path).suffix
        smart_name = generate_smart_filename(data, extension="")

        # 5️⃣ Move file into organised folder structure
        new_path = move_to_category(
            abs_file_path,   # pass absolute source path
            category,
            smart_name,
            date_str=date_str,
        )

        # Resolve or create the Category
        category_query = db.query(Category).filter(func.lower(Category.name) == category.lower())
        
        if screenshot.user_id:
            category_query = category_query.filter(Category.user_id == screenshot.user_id)
        else:
            category_query = category_query.filter(Category.session_id == screenshot.session_id)
            
        category_record = category_query.first()
        
        if not category_record:
            category_record = Category(
                user_id=screenshot.user_id,
                session_id=screenshot.session_id if not screenshot.user_id else None,
                name=category.title()
            )
            db.add(category_record)
            db.commit()
            db.refresh(category_record)

        # 6️⃣ Persist everything to the database
        screenshot.smart_filename     = smart_name
        screenshot.file_path          = new_path
        screenshot.extracted_text     = text
        screenshot.category_id        = category_record.id
        screenshot.summary            = summary
        screenshot.tags               = tags
        screenshot.confidence         = confidence
        screenshot.status             = "COMPLETED"
        screenshot.completed_at       = func.now()

        db.commit()

    except Exception as e:
        # ❌ Failure path
        if screenshot:
            screenshot.status = "FAILED"
            screenshot.error_message = str(e)
            db.commit()

        raise self.retry(exc=e, countdown=5)

    finally:
        db.close()