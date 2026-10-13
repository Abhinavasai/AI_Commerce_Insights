from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class InsightOut(BaseModel):
    id: str
    title: str
    content: str
    insight_type: str
    confidence: float
    source_document_ids: list[str] = []
    tags: list[str] = []
    generated_by: str
    owner_id: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class GenerateInsightsRequest(BaseModel):
    document_id: str | None = None
