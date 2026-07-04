from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.screenshot import Screenshot
from app.core.config import settings
from datetime import datetime, timedelta
import os

@celery_app.task
def cleanup_anonymous_data():
    db = SessionLocal()
    try:
        # 24 hours ago
        threshold = datetime.utcnow() - timedelta(hours=24)
        
        expired = db.query(Screenshot).filter(
            Screenshot.user_id == None,
            Screenshot.created_at < threshold
        ).all()
        
        count = 0
        for s in expired:
            raw = s.file_path.replace("\\", "/")
            upload_dir = settings.UPLOAD_DIR.strip("./")
            for prefix in (f"./{upload_dir}/", f"{upload_dir}/"):
                if raw.startswith(prefix):
                    raw = raw[len(prefix):]
                    break
            file_path = os.path.join(settings.UPLOAD_DIR, raw)
            
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Cleanup error removing file {file_path}: {e}")
                
            db.delete(s)
            count += 1
            
        db.commit()
        return f"Cleaned up {count} anonymous screenshots."
    finally:
        db.close()
