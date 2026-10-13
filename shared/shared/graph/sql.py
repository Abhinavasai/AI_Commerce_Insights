from __future__ import annotations

from typing import Any

from sqlalchemy import func, select

from shared.db.session import get_session_factory
from shared.graph.base import GraphStore
from shared.models.catalog import Category, EntityLink, Product, Seller
from shared.models.base import new_uuid


class SqlGraphStore(GraphStore):
    """Knowledge-graph substitute using relational tables (local mode)."""

    async def ensure_schema(self) -> None:
        return None

    async def upsert_seller(self, seller_id: str, name: str, props: dict | None = None) -> None:
        factory = get_session_factory()
        async with factory() as session:
            existing = await session.get(Seller, seller_id)
            if existing:
                existing.name = name
                if props:
                    existing.meta = {**(existing.meta or {}), **props}
            else:
                session.add(
                    Seller(id=seller_id, name=name, region=(props or {}).get("region", ""), meta=props or {})
                )
            await session.commit()

    async def upsert_category(
        self, category_id: str, name: str, props: dict | None = None
    ) -> None:
        factory = get_session_factory()
        async with factory() as session:
            existing = await session.get(Category, category_id)
            if existing:
                existing.name = name
                if props and props.get("description"):
                    existing.description = props["description"]
            else:
                session.add(
                    Category(
                        id=category_id,
                        name=name,
                        description=(props or {}).get("description", ""),
                    )
                )
            await session.commit()

    async def upsert_product(
        self,
        product_id: str,
        name: str,
        seller_id: str | None = None,
        category_id: str | None = None,
        props: dict | None = None,
    ) -> None:
        factory = get_session_factory()
        async with factory() as session:
            existing = await session.get(Product, product_id)
            if existing:
                existing.name = name
                existing.seller_id = seller_id or existing.seller_id
                existing.category_id = category_id or existing.category_id
                if props:
                    existing.attributes = {**(existing.attributes or {}), **props}
                    if "price" in props:
                        existing.price = float(props["price"])
            else:
                session.add(
                    Product(
                        id=product_id,
                        name=name,
                        seller_id=seller_id,
                        category_id=category_id,
                        price=float((props or {}).get("price", 0)),
                        sku=(props or {}).get("sku", ""),
                        attributes=props or {},
                    )
                )
            await session.commit()

    async def link(
        self,
        source_type: str,
        source_id: str,
        rel_type: str,
        target_type: str,
        target_id: str,
        meta: dict | None = None,
    ) -> None:
        factory = get_session_factory()
        async with factory() as session:
            session.add(
                EntityLink(
                    id=new_uuid(),
                    source_type=source_type,
                    source_id=source_id,
                    rel_type=rel_type,
                    target_type=target_type,
                    target_id=target_id,
                    meta=meta or {},
                )
            )
            await session.commit()

    async def query_neighbors(
        self, entity_type: str, entity_id: str, rel_type: str | None = None
    ) -> list[dict[str, Any]]:
        factory = get_session_factory()
        async with factory() as session:
            q = select(EntityLink).where(
                EntityLink.source_type == entity_type,
                EntityLink.source_id == entity_id,
            )
            if rel_type:
                q = q.where(EntityLink.rel_type == rel_type)
            rows = (await session.execute(q)).scalars().all()
            return [
                {
                    "rel_type": r.rel_type,
                    "target_type": r.target_type,
                    "target_id": r.target_id,
                    "meta": r.meta,
                }
                for r in rows
            ]

    async def catalog_summary(self) -> dict[str, Any]:
        factory = get_session_factory()
        async with factory() as session:
            products = await session.scalar(select(func.count()).select_from(Product)) or 0
            sellers = await session.scalar(select(func.count()).select_from(Seller)) or 0
            categories = await session.scalar(select(func.count()).select_from(Category)) or 0
            links = await session.scalar(select(func.count()).select_from(EntityLink)) or 0
            return {
                "products": products,
                "sellers": sellers,
                "categories": categories,
                "relationships": links,
            }
