# =============================================================================
# VERITY Backend — Configuration
# =============================================================================
from __future__ import annotations

import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- App ---
    app_name: str = "VERITY"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = Field(default="development")

    # --- Database ---
    database_url: str = Field(default="sqlite+aiosqlite:///verity.db")

    # --- Redis ---
    redis_url: str = Field(default="redis://localhost:6379")

    # --- Supabase ---
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")

    # --- OpenAI ---
    openai_api_key: str = Field(default="")

    # --- Gemini ---
    gemini_api_key: str = Field(default="")

    # --- Search ---
    search_api_key: str = Field(default="")
    search_api_provider: str = Field(default="kieai")

    # --- Auth ---
    auth_secret: str = Field(default="change-me-in-production")
    auth_token_expire_minutes: int = Field(default=1440)  # 24 hours

    # --- Storage ---
    storage_bucket: str = Field(default="verity-documents")
    max_upload_size_mb: int = Field(default=50)

    # --- AI Config ---
    default_model: str = Field(default="gpt-4o")
    embedding_model: str = Field(default="text-embedding-3-small")
    embedding_dimensions: int = Field(default=1536)
    fast_model: str = Field(default="gpt-4o-mini")
    strong_model: str = Field(default="gpt-4o")
    fallback_provider: str = Field(default="gemini")

    # --- Rate Limits ---
    rate_limit_per_minute: int = Field(default=60)
    max_concurrent_research: int = Field(default=3)

    # --- Sentry ---
    sentry_dsn: str = Field(default="")

    # --- CORS ---
    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:8000"])

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
