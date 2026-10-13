from __future__ import annotations

from pydantic import BaseModel
from fastapi import APIRouter

from shared.pipeline_bridge import process_document
from shared.ai import get_embedder

router = APIRouter()


class IngestRequest(BaseModel):
    document_id: str


class EmbedRequest(BaseModel):
    texts: list[str]


@router.post("/ingest")
async def ingest(body: IngestRequest):
    await process_document(body.document_id)
    return {"ok": True, "document_id": body.document_id}


@router.post("/embed")
async def embed(body: EmbedRequest):
    vectors = await get_embedder().embed(body.texts)
    return {"embeddings": vectors, "dims": len(vectors[0]) if vectors else 0}
