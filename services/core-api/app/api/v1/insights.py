from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session, require_roles
from app.schemas.insights import GenerateInsightsRequest, InsightOut
from shared.config import get_settings
from shared.models.insight import Insight
from shared.models.user import User
from shared.queue import get_job_queue

router = APIRouter()


@router.get("", response_model=list[InsightOut])
async def list_insights(
    insight_type: str | None = Query(None),
    tag: str | None = Query(None),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    q = select(Insight).order_by(Insight.created_at.desc())
    if insight_type:
        q = q.where(Insight.insight_type == insight_type)
    rows = (await session.execute(q)).scalars().all()
    if tag:
        rows = [r for r in rows if tag in (r.tags or [])]
    return rows


@router.get("/{insight_id}", response_model=InsightOut)
async def get_insight(
    insight_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    insight = await session.get(Insight, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    return insight


@router.post("/generate", response_model=list[InsightOut])
async def generate_insights(
    body: GenerateInsightsRequest,
    user: User = Depends(require_roles("admin", "analyst")),
    session: AsyncSession = Depends(get_db_session),
):
    settings = get_settings()
    # Prefer direct call to AI pipeline; fall back to queue
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{settings.ai_pipeline_url}/api/v1/generate-insight",
                json={"document_id": body.document_id, "owner_id": user.id},
            )
            if resp.status_code == 200:
                data = resp.json()
                ids = [i["id"] for i in data.get("insights", [])]
                if ids:
                    rows = (
                        await session.execute(select(Insight).where(Insight.id.in_(ids)))
                    ).scalars().all()
                    return rows
    except Exception:
        pass
    await get_job_queue().publish(
        "insights.generate", {"document_id": body.document_id, "owner_id": user.id}
    )
    # Local in-process may have created them; return latest
    q = select(Insight).order_by(Insight.created_at.desc()).limit(10)
    return (await session.execute(q)).scalars().all()


@router.delete("/{insight_id}")
async def delete_insight(
    insight_id: str,
    user: User = Depends(require_roles("admin", "analyst")),
    session: AsyncSession = Depends(get_db_session),
):
    insight = await session.get(Insight, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    await session.delete(insight)
    return {"ok": True}
