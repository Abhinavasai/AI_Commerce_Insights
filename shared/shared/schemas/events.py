from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class JobEvent(BaseModel):
    job_type: str
    payload: dict[str, Any] = Field(default_factory=dict)
