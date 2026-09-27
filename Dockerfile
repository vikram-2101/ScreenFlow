FROM python:3.12-slim

# Install system packages (Tesseract OCR and PostgreSQL client libraries)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Ensure upload directory exists
RUN mkdir -p uploads

EXPOSE 8000

# Start Celery worker in background and launch FastAPI via Uvicorn on Render's assigned $PORT
CMD ["sh", "-c", "alembic upgrade head && celery -A app.core.celery_app.celery_app worker --pool=solo --loglevel=info & uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
