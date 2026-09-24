"""
backend/app/config.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Application settings loaded from environment variables (.env file).
Uses pydantic-settings for type-safe configuration.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = "sqlite:///./intelliresearch.db"

    # ── Auth (shared with Module 1) ───────────────────────────────────────────
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # ── NIH RePORTER ─────────────────────────────────────────────────────────
    nih_reporter_base_url: str = "https://api.reporter.nih.gov/v2"

    # ── Grants.gov ───────────────────────────────────────────────────────────
    grants_gov_base_url: str = "https://apply07.grants.gov/grantsws"

    # ── Ingestion tuning ─────────────────────────────────────────────────────
    funding_sync_default_limit: int = 50
    funding_sync_timeout_seconds: int = 30
    funding_sync_max_retries: int = 3


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — import this everywhere."""
    return Settings()
