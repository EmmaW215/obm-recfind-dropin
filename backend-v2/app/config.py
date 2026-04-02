"""Application Configuration — pydantic-settings"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "RecFindOBM API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/recfindobm"
    SUPPORTED_CITIES: List[str] = ["oakville"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
