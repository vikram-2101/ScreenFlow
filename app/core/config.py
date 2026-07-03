from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- infrastructure ---
    REDIS_URL: str = "redis://localhost:6379/0"
    DATABASE_URL: str | None = None
    
    # --- auth ---
    SECRET_KEY: str | None = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

   # --- AI / LLM ---
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None  # add this line

    # --- storage ---
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # --- Google Calendar (Phase 2) ---
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str | None = None

    # --- app ---
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

settings = Settings()