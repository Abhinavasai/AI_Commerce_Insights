from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy import func, or_, select

from shared.ai import get_embedder, get_llm_provider
from shared.db.session import get_session_factory
from shared.models.catalog import Category, Product, Seller
from shared.models.document import DocumentChunk
from shared.models.insight import Insight
from shared.utils.vectors import top_k_similar


async def tool_vector_search(query: str, k: int = 5) -> dict[str, Any]:
    factory = get_session_factory()
    embedder = get_embedder()
    qvec = (await embedder.embed([query]))[0]
    async with factory() as session:
        chunks = (await session.execute(select(DocumentChunk).limit(500))).scalars().all()
        ranked = top_k_similar(qvec, [(c, c.embedding or []) for c in chunks], k=k)
        return {
            "results": [
                {
                    "chunk_id": c.id,
                    "document_id": c.document_id,
                    "score": round(score, 4),
                    "content": c.content[:600],
                }
                for c, score in ranked
            ]
        }


async def tool_catalog_lookup(query: str) -> dict[str, Any]:
    factory = get_session_factory()
    q = f"%{query}%"
    async with factory() as session:
        products = (
            await session.execute(select(Product).where(Product.name.ilike(q)).limit(10))
        ).scalars().all()
        sellers = (
            await session.execute(select(Seller).where(Seller.name.ilike(q)).limit(10))
        ).scalars().all()
        return {
            "products": [{"id": p.id, "name": p.name, "price": p.price} for p in products],
            "sellers": [{"id": s.id, "name": s.name, "region": s.region} for s in sellers],
        }


async def tool_insight_search(query: str) -> dict[str, Any]:
    factory = get_session_factory()
    q = f"%{query}%"
    async with factory() as session:
        rows = (
            await session.execute(
                select(Insight)
                .where(or_(Insight.title.ilike(q), Insight.content.ilike(q)))
                .limit(8)
            )
        ).scalars().all()
        if not rows:
            rows = (
                await session.execute(select(Insight).order_by(Insight.confidence.desc()).limit(5))
            ).scalars().all()
        return {
            "insights": [
                {
                    "id": i.id,
                    "title": i.title,
                    "type": i.insight_type,
                    "confidence": i.confidence,
                    "content": i.content[:400],
                }
                for i in rows
            ]
        }


async def tool_graph_query(query: str) -> dict[str, Any]:
    factory = get_session_factory()
    async with factory() as session:
        product_count = await session.scalar(select(func.count()).select_from(Product)) or 0
        seller_count = await session.scalar(select(func.count()).select_from(Seller)) or 0
        category_rows = (
            await session.execute(
                select(Category.name, func.count(Product.id))
                .outerjoin(Product, Product.category_id == Category.id)
                .group_by(Category.name)
            )
        ).all()
        top_sellers = (
            await session.execute(
                select(Seller.name, func.count(Product.id))
                .outerjoin(Product, Product.seller_id == Seller.id)
                .group_by(Seller.name)
                .order_by(func.count(Product.id).desc())
                .limit(5)
            )
        ).all()
        return {
            "query": query,
            "totals": {"products": product_count, "sellers": seller_count},
            "categories": [{"name": n, "products": c} for n, c in category_rows],
            "top_sellers": [{"name": n, "products": c} for n, c in top_sellers],
        }


def _pick_tools(message: str) -> list[str]:
    m = message.lower()
    tools = ["vector_search"]
    if any(w in m for w in ("seller", "product", "catalog", "price", "sku")):
        tools.append("catalog_lookup")
    if any(w in m for w in ("insight", "trend", "anomaly", "recommend")):
        tools.append("insight_search")
    if any(w in m for w in ("how many", "top", "category", "graph", "relationship")):
        tools.append("graph_query")
    return tools


async def run_commerce_agent(message: str) -> AsyncIterator[dict[str, Any]]:
    tools = _pick_tools(message)
    tool_outputs: dict[str, Any] = {}

    for name in tools:
        yield {"event": "tool_call", "data": {"name": name}}
        if name == "vector_search":
            tool_outputs[name] = await tool_vector_search(message)
        elif name == "catalog_lookup":
            tool_outputs[name] = await tool_catalog_lookup(message)
        elif name == "insight_search":
            tool_outputs[name] = await tool_insight_search(message)
        elif name == "graph_query":
            tool_outputs[name] = await tool_graph_query(message)
        yield {"event": "tool_result", "data": {"name": name, "result": tool_outputs[name]}}

    context_parts = []
    for name, out in tool_outputs.items():
        context_parts.append(f"### {name}\n{json.dumps(out, indent=2)[:3000]}")
    context = "\n\n".join(context_parts)

    llm = get_llm_provider()
    messages = [
        {
            "role": "system",
            "content": (
                "You are a commerce analyst assistant for the AI Commerce Insights platform. "
                "Use the tool results to answer clearly with markdown tables when helpful. "
                "Cite sellers, products, and document-derived facts when available."
            ),
        },
        {
            "role": "user",
            "content": f"Question: {message}\n\nTool results:\n{context}",
        },
    ]
    async for token in llm.stream(messages, context=context):
        yield {"event": "token", "data": token}
    yield {"event": "done", "data": {}}
