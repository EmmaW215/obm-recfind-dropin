"""Application Configuration"""
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "OBM RecFind Drop-In"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/obm_recfind"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SUPPORTED_CITIES: list = ["oakville", "burlington", "mississauga"]
    FREE_TIER_CITIES: list = ["oakville", "burlington"]
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
