from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session
from shared.models.chat import ChatSession
from shared.models.document import Document
from shared.models.insight import Insight
from shared.models.catalog import Category, Product, Seller
from shared.models.user import User
from shared.runtime import resolve_runtime_mode

router = APIRouter()


@router.get("/stats")
async def dashboard_stats(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    total_docs = await session.scalar(select(func.count()).select_from(Document)) or 0
    completed = await session.scalar(
        select(func.count()).select_from(Document).where(Document.status == "completed")
    ) or 0
    pending = await session.scalar(
        select(func.count()).select_from(Document).where(Document.status == "pending")
    ) or 0
    processing = await session.scalar(
        select(func.count()).select_from(Document).where(Document.status == "processing")
    ) or 0
    failed = await session.scalar(
        select(func.count()).select_from(Document).where(Document.status == "failed")
    ) or 0
    insights = await session.scalar(select(func.count()).select_from(Insight)) or 0
    sessions = await session.scalar(
        select(func.count()).select_from(ChatSession).where(ChatSession.user_id == user.id)
    ) or 0
    products = await session.scalar(select(func.count()).select_from(Product)) or 0
    sellers = await session.scalar(select(func.count()).select_from(Seller)) or 0
    categories = await session.scalar(select(func.count()).select_from(Category)) or 0

    # Insights by type
    type_rows = (
        await session.execute(
            select(Insight.insight_type, func.count()).group_by(Insight.insight_type)
        )
    ).all()
    insights_by_type = {t: c for t, c in type_rows}

    recent_docs = (
        await session.execute(select(Document).order_by(Document.created_at.desc()).limit(5))
    ).scalars().all()
    recent_insights = (
        await session.execute(select(Insight).order_by(Insight.created_at.desc()).limit(5))
    ).scalars().all()

    return {
        "runtime_mode": resolve_runtime_mode(),
        "totals": {
            "documents": total_docs,
            "insights": insights,
            "chat_sessions": sessions,
            "products": products,
            "sellers": sellers,
            "categories": categories,
        },
        "document_status": {
            "completed": completed,
            "pending": pending,
            "processing": processing,
            "failed": failed,
        },
        "insights_by_type": insights_by_type,
        "recent_documents": [
            {"id": d.id, "title": d.title, "status": d.status} for d in recent_docs
        ],
        "recent_insights": [
            {"id": i.id, "title": i.title, "insight_type": i.insight_type, "confidence": i.confidence}
            for i in recent_insights
        ],
    }
