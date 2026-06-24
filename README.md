# ScreenFlow

Intelligent screenshot management, classification, and secure organization for modern workflows.

## Project Overview

ScreenFlow is a full-stack proof-of-concept for a screenshot-first productivity platform. It combines:

- FastAPI backend with JWT authentication
- SQLAlchemy + PostgreSQL metadata storage
- Redis-powered Celery background processing
- OCR text extraction via Tesseract
- LLM-assisted screenshot classification and smart naming
- React + Vite frontend with drag-and-drop upload, search, and dashboard views
- Per-user screenshot isolation and duplicate detection

This repo demonstrates a working MVP: upload screenshots, process them in the background, and surface organized results through a secure UI.

## Key Features

- User sign up / login with JWT auth
- Screenshot upload endpoint with duplicate detection
- Background OCR and content classification pipeline
- Smart filenames generated from extracted metadata
- Search screenshots by OCR text
- Thumbnail preview and processing status on dashboard
- Secure per-user data isolation
- Folder structure organization on disk by category and date

## Tech Stack

### Backend

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Celery
- Redis
- pytesseract
- OpenAI / Gemini extraction fallback
- Python-JOSE + Passlib for auth

### Frontend

- React 19
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- React Dropzone

## Repository Structure

- `app/` — backend application package
  - `api/` — FastAPI route modules
  - `models/` — SQLAlchemy data models
  - `schemas/` — Pydantic request/response models
  - `services/` — OCR, content extraction, filename generation
  - `utils/` — file handling and organization helpers
  - `workers/` — Celery background tasks
  - `core/` — config, Celery app, security utilities
  - `db/` — database session and base metadata
- `frontend/` — React UI app
- `alembic/` — database migration scripts
- `tests/` — backend tests
- `.env.example` — sample environment variables

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL
- Redis
- Node.js 20+
- Tesseract OCR installed (required for `pytesseract`)

### Backend Setup

1. Create and activate your Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install backend dependencies:

```powershell
pip install -r requirements.txt
```

3. Copy the environment example and set values:

```powershell
copy .env.example .env
```

4. Update `.env` with your database URL and any API keys:

- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL`
- `SECRET_KEY`
- `GEMINI_API_KEY` or `OPENAI_API_KEY` if available

5. Create the database and run migrations:

```powershell
alembic upgrade head
```

### Frontend Setup

1. Change into the frontend directory:

```powershell
cd frontend
```

2. Install dependencies:

```powershell
npm install
```

### Running the App Locally

In separate terminals:

1. Start Redis
2. Start PostgreSQL
3. Start the backend API:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

4. Start the Celery worker:

```powershell
celery -A app.core.celery_app.celery_app worker --loglevel=info
```

5. Start the frontend app:

```powershell
cd frontend
npm run dev
```

### Default URLs

- Backend: `http://127.0.0.1:8001`
- Frontend: `http://127.0.0.1:5173`

## Usage

1. Open the frontend and sign up with an email/password.
2. Upload a screenshot using the drag-and-drop upload zone.
3. Wait for processing to complete.
4. Browse your dashboard to view categorized screenshots.
5. Use the search bar to filter screenshots by extracted text.

## API Endpoints

### Auth

- `POST /api/auth/signup` — create user and return token
- `POST /api/auth/login` — authenticate and return token
- `POST /api/auth/logout` — stateless logout
- `GET /api/auth/me` — fetch current user info

### Screenshots

- `POST /api/screenshots/upload` — upload image
- `GET /api/screenshots/` — list user screenshots
- `GET /api/screenshots/{id}` — get screenshot metadata
- `GET /api/screenshots/{id}/file` — download or view image
- `GET /api/screenshots/search?q=` — search by OCR text
- `PATCH /api/screenshots/{id}/override` — update category / filename

## Architecture Notes

- Uploaded screenshots are saved under `UPLOAD_DIR` and then moved into an organized structure by year/month/category.
- Background processing uses Celery tasks to run OCR, rich metadata extraction, smart filename generation, and storage updates asynchronously.
- The classification pipeline prefers Gemini when available and falls back to local regex extraction when needed.
- The frontend stores JWTs in `localStorage` and attaches them automatically to API requests using Axios interceptors.

## Security Considerations

- All screenshot routes require a valid JWT token.
- Each request is scoped to the authenticated user.
- Uploaded screenshot duplicates are detected with SHA-256 hashing.
- Sensitive metadata processing is kept separated from route payloads.

## Next Improvements

Potential enhancements include:

- add a richer analytics dashboard
- support image similarity search
- add role-based access and team sharing
- support S3 or object storage for uploads
- build mobile client for native screenshot ingestion
- extend sensitive-data redaction and vault behavior

## Acknowledgements

This repo was built as an end-to-end screenshot intelligence MVP with FastAPI, React, Celery, and OCR/LLM-based metadata extraction.

---

