from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = Field(default="development")
    DATABASE_URL: str = Field(default="sqlite:///./app.db")
    SECRET_KEY: str = Field(default="change-me-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    CORS_ORIGINS: str = Field(default="http://localhost:5173")
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # Research Provider API Keys
    SEMANTIC_SCHOLAR_API_KEY: str | None = Field(default=None)
    OPENALEX_API_KEY: str | None = Field(default=None)
    CORE_API_KEY: str | None = Field(default=None)
    SERPAPI_API_KEY: str | None = Field(default=None)
    CROSSREF_MAILTO: str = Field(default="researcher@platform.org")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        if not value:
            return "http://localhost:5173"
        return value


@lru_cache()
def get_settings() -> Settings:
    return Settings()
