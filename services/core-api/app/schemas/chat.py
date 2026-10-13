from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ChatSessionOut(BaseModel):
    id: str
    title: str
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ChatMessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    token_count: int = 0
    meta: dict[str, Any] = {}
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ChatSessionDetail(ChatSessionOut):
    messages: list[ChatMessageOut] = []


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


class SendMessageRequest(BaseModel):
    content: str
