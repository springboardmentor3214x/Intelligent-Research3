from functools import lru_cache

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

    # Module 3 — Research Data Ingestion (OpenAlex)
    # Optional: provide your e-mail to use OpenAlex polite pool (faster rate limits)
    # See: https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication
    OPENALEX_MAILTO: str = Field(default="")

    # Module 3 — AI Paper Analysis (optional)
    # If set, OpenAI or OpenAI-compatible endpoint (e.g., Modal) is used for richer structured analysis.
    # If not set, rule-based analysis from abstract is used instead.
    OPENAI_API_KEY: str = Field(default="")
    OPENAI_API_BASE: str = Field(default="")
    MODAL_TOKEN_ID: str = Field(default="")
    MODAL_TOKEN_SECRET: str = Field(default="")
    MODAL_AUTH_BEARER: str = Field(default="")

    # Module 3 — Real-Time Research Data (Semantic Scholar)
    # API key for authenticated access to Semantic Scholar.
    # Unlocks higher rate limits and richer paper metadata.
    # Get your key: https://www.semanticscholar.org/product/api
    SEMANTIC_SCHOLAR_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")
    GOOGLE_API_KEY: str = Field(default="")

    # Module 4 — Funding Data (grants.gov — no key required)
    # Optional mailto for polite usage
    GRANTS_GOV_MAILTO: str = Field(default="")

    # Module 5 — Patent Landscape Analysis
    # SerpApi Google Patents API Key (https://serpapi.com)
    SERPAPI_API_KEY: str = Field(default="")
    # USPTO Open Data Portal API Key (from developer.uspto.gov / data.uspto.gov)
    USPTO_API_KEY: str = Field(default="")
    # The Lens Patent API Bearer Token (from api.lens.org)
    LENS_API_KEY: str = Field(default="")
    PATENT_SOURCE: str = Field(default="serpapi")

    model_config = SettingsConfigDict(
        env_file=".env",
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
