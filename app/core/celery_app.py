from celery import Celery
from celery.schedules import crontab
from app.core.config import settings  # if you have config, else hardcode

import ssl

redis_url = settings.REDIS_URL or "redis://localhost:6379/0"

# Auto-upgrade Upstash connections to rediss:// (TLS) if needed
if "upstash.io" in redis_url and redis_url.startswith("redis://"):
    redis_url = redis_url.replace("redis://", "rediss://", 1)

use_ssl = redis_url.startswith("rediss://")
if use_ssl and "ssl_cert_reqs=" not in redis_url:
    separator = "&" if "?" in redis_url else "?"
    redis_url = f"{redis_url}{separator}ssl_cert_reqs=none"

broker_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE} if use_ssl else None
redis_backend_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE} if use_ssl else None

celery_app = Celery(
    "screenflow",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    broker_use_ssl=broker_use_ssl,
    redis_backend_use_ssl=redis_backend_use_ssl,
)


# IMPORTANT: force task registration
import app.workers.ocr_tasks  # noqa
import app.workers.cleanup_tasks # noqa

# Register all models so SQLAlchemy metadata (including FK targets like 'users')
# is fully built before any task tries to commit.
import app.models.user        # noqa
import app.models.screenshot   # noqa

celery_app.conf.beat_schedule = {
    "cleanup-anonymous-data-every-hour": {
        "task": "app.workers.cleanup_tasks.cleanup_anonymous_data",
        "schedule": crontab(minute=0), # Every hour
    },
}