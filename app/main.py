from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import screenshots, analytics, auth, categories
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ScreenFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
