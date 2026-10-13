from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    title: str
    file_name: str
    file_type: str
    file_size: int
    storage_key: str
    status: str
    chunk_count: int
    error_message: str | None = None
    meta: dict[str, Any] = {}
    owner_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ChunkOut(BaseModel):
    id: str
    chunk_index: int
    content: str
    token_count: int

    model_config = {"from_attributes": True}


class DocumentDetail(DocumentOut):
    chunks: list[ChunkOut] = []


class DownloadOut(BaseModel):
    url: str
