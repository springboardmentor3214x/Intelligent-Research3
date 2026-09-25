from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = Field(default="development")

    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/research_platform"
    )

    SECRET_KEY: str = Field(default="change-me-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:5174"
    )

    FRONTEND_URL: str = Field(
        default="http://localhost:5173"
    )

    GOOGLE_CLIENT_ID: str = Field(
        default=""
    )
    GOOGLE_CLIENT_SECRET: str = Field(
        default=""
    )
    GOOGLE_REDIRECT_URI: str = Field(
        default="http://127.0.0.1:8000/auth/google/callback"
    )

    # ── Module 3 & 6 — Research Data & OpenAlex (polite pool) ───────────────────
    OPENALEX_MAILTO: str = Field(default="")

    # ── Module 6: Technology Intelligence API Configuration ──────────────────
    # Semantic Scholar (optional, improves rate limits)
    SEMANTIC_SCHOLAR_API_KEY: str = Field(default="")
    # Patent APIs
    EPO_CLIENT_ID: str = Field(default="")
    EPO_CLIENT_SECRET: str = Field(default="")
    PATENT_API_URL: str = Field(default="https://api.patentsview.org/patents/query")
    # Module 6 feature flags
    TECH_AUTO_SEED_DEMO: bool = Field(default=True, description="Auto-seed demo tech data on startup")
    TECH_ANALYSIS_START_YEAR: int = Field(default=2019)
    TECH_ANALYSIS_END_YEAR: int = Field(default=2025)

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent.parent / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        return value or "http://localhost:5173,http://localhost:5174"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
