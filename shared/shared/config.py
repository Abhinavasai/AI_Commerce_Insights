"""Shared application settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    runtime_mode: str = "local"
    jwt_secret: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    database_url: str = f"sqlite+aiosqlite:///{(ROOT / 'data' / 'commerce.db').as_posix()}"

    def resolved_database_url(self) -> str:
        """Resolve relative sqlite paths against project ROOT."""
        url = self.database_url
        if url.startswith("sqlite") and ":///" in url:
            path = url.split(":///", 1)[1]
            p = Path(path)
            if not p.is_absolute():
                p = (ROOT / path).resolve()
            p.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite+aiosqlite:///{p.as_posix()}"
        return url

    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "commerceai"

    aws_region: str = "us-east-1"
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_endpoint_url: str | None = None
    s3_bucket: str = "commerceai-documents"
    sqs_queue_url: str = ""
    sqs_dlq_url: str = ""

    local_storage_path: str = str(ROOT / "storage" / "uploads")

    openai_api_key: str | None = None
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-4o"

    core_api_url: str = "http://localhost:8100"
    ai_pipeline_url: str = "http://localhost:8001"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
