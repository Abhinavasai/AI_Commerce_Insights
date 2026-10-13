from __future__ import annotations

from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from shared.models.base import Base, TimestampMixin, new_uuid


class Insight(Base, TimestampMixin):
    __tablename__ = "insights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    title: Mapped[str] = mapped_column(String(512))
    content: Mapped[str] = mapped_column(Text)
    insight_type: Mapped[str] = mapped_column(
        String(64), default="summary"
    )  # trend|anomaly|recommendation|summary
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    source_document_ids: Mapped[list] = mapped_column(JSON, default=list)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    generated_by: Mapped[str] = mapped_column(String(64), default="system")
    owner_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )

    owner = relationship("User", back_populates="insights")
