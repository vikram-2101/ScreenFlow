from celery import Celery
from celery.schedules import crontab
from app.core.config import settings  # if you have config, else hardcode

celery_app = Celery(
    "screenflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

import ssl

broker_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE} if settings.REDIS_URL.startswith("rediss://") else None
redis_backend_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE} if settings.REDIS_URL.startswith("rediss://") else None

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