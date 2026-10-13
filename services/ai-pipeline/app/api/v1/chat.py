from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agents.commerce_agent import run_commerce_agent

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str


@router.post("/chat")
async def chat(body: ChatRequest):
    async def gen():
        async for event in run_commerce_agent(body.message):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
