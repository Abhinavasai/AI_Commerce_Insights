from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.models.base import Base, TimestampMixin, new_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255), default="")
    role: Mapped[str] = mapped_column(String(32), default="analyst")  # admin|analyst|viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    documents = relationship("Document", back_populates="owner")
    insights = relationship("Insight", back_populates="owner")
    chat_sessions = relationship("ChatSession", back_populates="user")
