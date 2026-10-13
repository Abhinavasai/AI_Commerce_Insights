from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from shared.models.base import Base, TimestampMixin, new_uuid


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")

    products = relationship("Product", back_populates="category")


class Seller(Base, TimestampMixin):
    __tablename__ = "sellers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    region: Mapped[str] = mapped_column(String(128), default="")
    meta: Mapped[dict] = mapped_column(JSON, default=dict)

    products = relationship("Product", back_populates="seller")


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(512), index=True)
    sku: Mapped[str] = mapped_column(String(128), default="")
    price: Mapped[float] = mapped_column(Float, default=0.0)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    seller_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("sellers.id"), nullable=True
    )
    category_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("categories.id"), nullable=True
    )

    seller = relationship("Seller", back_populates="products")
    category = relationship("Category", back_populates="products")


class EntityLink(Base, TimestampMixin):
    """SQL-graph edge: source_type/source_id -[:rel_type]-> target_type/target_id."""

    __tablename__ = "entity_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    source_type: Mapped[str] = mapped_column(String(64), index=True)
    source_id: Mapped[str] = mapped_column(String(36), index=True)
    rel_type: Mapped[str] = mapped_column(String(64), index=True)
    target_type: Mapped[str] = mapped_column(String(64), index=True)
    target_id: Mapped[str] = mapped_column(String(36), index=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
