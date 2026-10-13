from __future__ import annotations

import json

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user, get_db_session
from app.schemas.chat import (
    ChatMessageOut,
    ChatSessionDetail,
    ChatSessionOut,
    CreateSessionRequest,
    SendMessageRequest,
)
from shared.config import get_settings
from shared.models.chat import ChatMessage, ChatSession
from shared.models.user import User

router = APIRouter()


@router.get("/sessions", response_model=list[ChatSessionOut])
async def list_sessions(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    rows = (
        await session.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user.id)
            .order_by(ChatSession.updated_at.desc())
        )
    ).scalars().all()
    return rows


@router.post("/sessions", response_model=ChatSessionOut)
async def create_session(
    body: CreateSessionRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    cs = ChatSession(title=body.title, user_id=user.id)
    session.add(cs)
    await session.flush()
    return cs


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session(
    session_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == user.id)
    )
    cs = result.scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Session not found")
    msgs = sorted(cs.messages, key=lambda m: m.created_at or 0)
    return ChatSessionDetail(
        **ChatSessionOut.model_validate(cs).model_dump(),
        messages=[ChatMessageOut.model_validate(m) for m in msgs],
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    cs = await session.get(ChatSession, session_id)
    if not cs or cs.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    await session.delete(cs)
    return {"ok": True}


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    body: SendMessageRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    cs = await session.get(ChatSession, session_id)
    if not cs or cs.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    user_msg = ChatMessage(
        session_id=session_id, role="user", content=body.content, token_count=len(body.content.split())
    )
    session.add(user_msg)
    if cs.title == "New Chat":
        cs.title = body.content[:60]
        session.add(cs)
    await session.commit()

    settings = get_settings()

    async def event_stream():
        assistant_text = []
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{settings.ai_pipeline_url}/api/v1/chat",
                    json={
                        "session_id": session_id,
                        "user_id": user.id,
                        "message": body.content,
                    },
                ) as resp:
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        yield f"{line}\n\n" if not line.startswith("data:") else f"{line}\n\n"
                        if line.startswith("data:"):
                            raw = line[5:].strip()
                            try:
                                payload = json.loads(raw)
                                if payload.get("event") == "token":
                                    assistant_text.append(payload.get("data", ""))
                            except Exception:
                                pass
        except Exception as exc:
            # Fallback: local inline mock reply if AI pipeline is down
            from shared.ai import get_llm_provider
            from shared.db.session import get_session_factory
            from sqlalchemy import select as sel
            from shared.models.document import DocumentChunk
            from shared.ai import get_embedder
            from shared.utils.vectors import top_k_similar

            factory = get_session_factory()
            context = ""
            async with factory() as db:
                chunks = (await db.execute(sel(DocumentChunk).limit(200))).scalars().all()
                emb = get_embedder()
                qvec = (await emb.embed([body.content]))[0]
                ranked = top_k_similar(
                    qvec, [(c, c.embedding or []) for c in chunks], k=4
                )
                context = "\n\n".join(c.content for c, _ in ranked)
            llm = get_llm_provider()
            yield f"data: {json.dumps({'event': 'tool_call', 'data': {'name': 'vector_search'}})}\n\n"
            yield f"data: {json.dumps({'event': 'tool_result', 'data': {'chunks': len(context.split())}})}\n\n"
            async for token in llm.stream(
                [{"role": "user", "content": body.content}], context=context
            ):
                assistant_text.append(token)
                yield f"data: {json.dumps({'event': 'token', 'data': token})}\n\n"
            yield f"data: {json.dumps({'event': 'done', 'data': {}})}\n\n"

        # Persist assistant message
        text = "".join(assistant_text)
        if text:
            factory = __import__("shared.db.session", fromlist=["get_session_factory"]).get_session_factory()
            async with factory() as db:
                db.add(
                    ChatMessage(
                        session_id=session_id,
                        role="assistant",
                        content=text,
                        token_count=len(text.split()),
                    )
                )
                await db.commit()

    return StreamingResponse(event_stream(), media_type="text/event-stream")
