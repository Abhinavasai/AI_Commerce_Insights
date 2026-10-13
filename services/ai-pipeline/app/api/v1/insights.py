from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from shared.pipeline_bridge import generate_insights

router = APIRouter()


class GenerateRequest(BaseModel):
    document_id: str | None = None
    owner_id: str | None = None


@router.post("/generate-insight")
async def generate(body: GenerateRequest):
    ids = await generate_insights(body.document_id, body.owner_id)
    return {"insights": [{"id": i} for i in ids]}
