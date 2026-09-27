from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import screenshots, analytics, auth, categories
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ScreenFlow API")

from app.core.config import settings

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://screens-flow.vercel.app",
    "https://kioku.page",
    "https://www.kioku.page",
]

if settings.FRONTEND_URL:
    for url in settings.FRONTEND_URL.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ScreenFlow backend running 🚀"}


app.include_router(auth.router, prefix="/api")
app.include_router(screenshots.router, prefix="/api/screenshots")
app.include_router(categories.router, prefix="/api/categories")
app.include_router(analytics.router, prefix="/api")
