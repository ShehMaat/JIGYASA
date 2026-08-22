from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Application
    APP_NAME: str = "Alkame AI Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # LLM Settings
    LLM_PROVIDER: str = "groq"  # "groq", "openai", "ollama", "openrouter"
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_FALLBACK_MODEL: str = "llama-3.1-8b-instant"
    LLM_BASE_URL: Optional[str] = "https://api.groq.com/openai/v1"
    LLM_MAX_RETRIES: int = 3
    LLM_TIMEOUT_SECONDS: int = 60

    # Database
    DATABASE_URL: str = "postgresql://alkame_user:alkame_password@localhost:5432/alkame_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Security
    SECRET_KEY: str = "alkame-dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }


settings = Settings()
