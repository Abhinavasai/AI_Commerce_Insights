from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user, get_db_session, require_roles
from app.schemas.documents import DocumentDetail, DocumentOut, DownloadOut
from shared.models.document import Document, DocumentChunk
from shared.models.user import User
from shared.queue import get_job_queue
from shared.storage import get_document_store

router = APIRouter()


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    q = select(Document).order_by(Document.created_at.desc())
    if user.role == "viewer":
        q = q.where(Document.status == "completed")
    rows = (await session.execute(q)).scalars().all()
    return rows


@router.post("", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    user: User = Depends(require_roles("admin", "analyst")),
    session: AsyncSession = Depends(get_db_session),
):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    doc_id = str(uuid.uuid4())
    ext = Path(file.filename or "upload.txt").suffix or ".txt"
    key = f"raw/{doc_id}{ext}"
    store = get_document_store()
    await store.put(key, data, content_type=file.content_type or "application/octet-stream")
    doc = Document(
        id=doc_id,
        title=title or (file.filename or "Untitled"),
        file_name=file.filename or f"{doc_id}{ext}",
        file_type=file.content_type or "application/octet-stream",
        file_size=len(data),
        storage_key=key,
        status="pending",
        owner_id=user.id,
        meta={},
    )
    session.add(doc)
    await session.flush()
    queue = get_job_queue()
    await queue.publish("document.process", {"document_id": doc.id})
    return doc


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(
    document_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(Document)
        .options(selectinload(Document.chunks))
        .where(Document.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks = sorted(doc.chunks, key=lambda c: c.chunk_index)
    return DocumentDetail(
        **DocumentOut.model_validate(doc).model_dump(),
        chunks=[
            {
                "id": c.id,
                "chunk_index": c.chunk_index,
                "content": c.content[:500],
                "token_count": c.token_count,
            }
            for c in chunks
        ],
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: User = Depends(require_roles("admin", "analyst")),
    session: AsyncSession = Depends(get_db_session),
):
    doc = await session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    store = get_document_store()
    try:
        await store.delete(doc.storage_key)
    except Exception:
        pass
    await session.delete(doc)
    return {"ok": True}


@router.get("/{document_id}/download", response_model=DownloadOut)
async def download_document(
    document_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    doc = await session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    store = get_document_store()
    url = await store.presigned_url(doc.storage_key)
    # For local mode, return streaming endpoint
    if url.startswith("/api/"):
        url = f"/api/v1/documents/{document_id}/content"
    return DownloadOut(url=url)


@router.get("/{document_id}/content")
async def document_content(
    document_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    doc = await session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    data = await get_document_store().get(doc.storage_key)
    return Response(content=data, media_type=doc.file_type or "application/octet-stream")


@router.post("/{document_id}/reprocess", response_model=DocumentOut)
async def reprocess(
    document_id: str,
    user: User = Depends(require_roles("admin", "analyst")),
    session: AsyncSession = Depends(get_db_session),
):
    doc = await session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = "pending"
    doc.error_message = None
    session.add(doc)
    await session.flush()
    await get_job_queue().publish("document.process", {"document_id": doc.id})
    return doc
