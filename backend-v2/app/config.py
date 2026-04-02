"""Application Configuration — pydantic-settings"""
import json
from typing import List

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings

_DEFAULT_CORS = (
    "http://localhost:3000,http://localhost:3001,"
    "http://127.0.0.1:3000,http://127.0.0.1:3001"
)


def _parse_allowed_origins(value: str) -> List[str]:
    """Parse ALLOWED_ORIGINS: JSON array string or comma-separated URLs (Render-friendly)."""
    s = value.strip()
    if not s:
        return []
    if s.startswith("["):
        try:
            parsed = json.loads(s)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"ALLOWED_ORIGINS must be valid JSON array or comma-separated URLs: {e}"
            ) from e
        if not isinstance(parsed, list):
            raise ValueError("ALLOWED_ORIGINS JSON must be an array of strings")
        return list(parsed)
    return [part.strip() for part in s.split(",") if part.strip()]


class Settings(BaseSettings):
    APP_NAME: str = "RecFindOBM API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    # Stored as str so env vars are not JSON-decoded as List before validation (avoids Render parse errors).
    ALLOWED_ORIGINS: str = Field(default=_DEFAULT_CORS)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/recfindobm"
    SUPPORTED_CITIES: List[str] = ["oakville"]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def allowed_origins_list(self) -> List[str]:
        return _parse_allowed_origins(self.ALLOWED_ORIGINS)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
