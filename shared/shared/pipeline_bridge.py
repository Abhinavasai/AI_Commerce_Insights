"""Shared ingest / insight job handlers used by worker and local in-process queue."""

from __future__ import annotations

import logging
import re
import uuid

from sqlalchemy import delete, select

from shared.ai import get_embedder, get_llm_provider
from shared.db.session import get_session_factory
from shared.graph import get_graph_store
from shared.models.base import new_uuid
from shared.models.catalog import Category, EntityLink, Product, Seller
from shared.models.document import Document, DocumentChunk
from shared.models.insight import Insight
from shared.queue.base import JobMessage, JobQueue
from shared.runtime import is_aws_mode
from shared.storage import get_document_store

logger = logging.getLogger(__name__)


def chunk_text(text: str, size: int = 800, overlap: int = 100) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    chunks = []
    i = 0
    while i < len(text):
        chunks.append(text[i : i + size])
        i += size - overlap
    return chunks


def parse_bytes(data: bytes, file_name: str, content_type: str) -> str:
    name = file_name.lower()
    if name.endswith(".csv") or "csv" in content_type:
        return data.decode("utf-8", errors="ignore")
    if name.endswith((".html", ".htm")) or "html" in content_type:
        raw = data.decode("utf-8", errors="ignore")
        return re.sub(r"<[^>]+>", " ", raw)
    # Best-effort text for pdf/docx/images
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        # Extract printable ASCII runs
        text = "".join(chr(b) if 32 <= b < 127 else " " for b in data)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:50000] if text else f"[Binary document: {file_name}]"


async def extract_entities_from_text(document_id: str, text: str) -> None:
    """Lightweight entity extraction for catalog population."""
    graph = get_graph_store()
    factory = get_session_factory()
    use_external_graph = is_aws_mode()

    sellers = set(re.findall(r"(?i)seller[:\s]+([A-Za-z0-9 &.-]{2,60})", text))
    products = set(re.findall(r"(?i)product[:\s]+([A-Za-z0-9 &.-]{2,80})", text))
    categories = set(re.findall(r"(?i)categor(?:y|ies)[:\s]+([A-Za-z0-9 &/-]{2,60})", text))

    for line in text.splitlines()[:200]:
        parts = [p.strip() for p in line.split(",")]
        if len(parts) >= 3 and parts[0].lower() not in {"name", "product", "sku"}:
            products.add(parts[0][:80])
            if len(parts) > 1:
                sellers.add(parts[1][:60])
            if len(parts) > 2:
                categories.add(parts[2][:60])

    if not sellers and not products:
        sellers = {"Demo Seller"}
        products = {"Extracted SKU from " + document_id[:8]}
        categories = {"General"}

    seller_ids: dict[str, str] = {}
    cat_ids: dict[str, str] = {}
    product_ids: dict[str, str] = {}

    async with factory() as session:
        with session.no_autoflush:
            for name in list(categories)[:20]:
                existing = await session.scalar(select(Category).where(Category.name == name))
                if existing:
                    cat_ids[name] = existing.id
                else:
                    cid = new_uuid()
                    session.add(
                        Category(id=cid, name=name, description=f"From document {document_id}")
                    )
                    cat_ids[name] = cid

            for name in list(sellers)[:20]:
                existing = await session.scalar(select(Seller).where(Seller.name == name))
                if existing:
                    seller_ids[name] = existing.id
                else:
                    sid = new_uuid()
                    session.add(Seller(id=sid, name=name, region="NA"))
                    seller_ids[name] = sid

            seller_list = list(seller_ids.items())
            cat_list = list(cat_ids.items())
            for i, name in enumerate(list(products)[:40]):
                existing = await session.scalar(select(Product).where(Product.name == name))
                if existing:
                    pid = existing.id
                else:
                    pid = new_uuid()
                    sid = seller_list[i % len(seller_list)][1] if seller_list else None
                    cid = cat_list[i % len(cat_list)][1] if cat_list else None
                    session.add(
                        Product(
                            id=pid,
                            name=name,
                            sku=f"SKU-{pid[:8].upper()}",
                            price=19.99 + i,
                            seller_id=sid,
                            category_id=cid,
                        )
                    )
                product_ids[name] = pid
                session.add(
                    EntityLink(
                        id=new_uuid(),
                        source_type="Product",
                        source_id=pid,
                        rel_type="MENTIONED_IN",
                        target_type="Document",
                        target_id=document_id,
                    )
                )

        await session.commit()

    if use_external_graph:
        for name, cid in cat_ids.items():
            await graph.upsert_category(cid, name)
        for name, sid in seller_ids.items():
            await graph.upsert_seller(sid, name, {"region": "NA"})
        for name, pid in product_ids.items():
            await graph.upsert_product(pid, name)
            await graph.link("Product", pid, "MENTIONED_IN", "Document", document_id)


async def process_document(document_id: str) -> None:
    factory = get_session_factory()
    store = get_document_store()
    embedder = get_embedder()

    async with factory() as session:
        doc = await session.get(Document, document_id)
        if not doc:
            logger.error("Document %s not found", document_id)
            return
        doc.status = "processing"
        session.add(doc)
        await session.commit()

    try:
        async with factory() as session:
            doc = await session.get(Document, document_id)
            assert doc
            raw = await store.get(doc.storage_key)
            text = parse_bytes(raw, doc.file_name, doc.file_type)
            pieces = chunk_text(text)
            await session.execute(
                delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
            )
            embeddings = await embedder.embed(pieces) if pieces else []
            for idx, (content, emb) in enumerate(zip(pieces, embeddings)):
                session.add(
                    DocumentChunk(
                        id=str(uuid.uuid4()),
                        document_id=document_id,
                        chunk_index=idx,
                        content=content,
                        embedding=emb,
                        token_count=len(content.split()),
                    )
                )
            doc.chunk_count = len(pieces)
            doc.status = "completed"
            doc.error_message = None
            session.add(doc)
            await session.commit()

        await extract_entities_from_text(document_id, text)
        logger.info("Processed document %s (%s chunks)", document_id, len(pieces))
    except Exception as exc:
        logger.exception("Failed processing %s", document_id)
        async with factory() as session:
            doc = await session.get(Document, document_id)
            if doc:
                doc.status = "failed"
                doc.error_message = str(exc)[:1000]
                session.add(doc)
                await session.commit()


async def generate_insights(document_id: str | None, owner_id: str | None) -> list[str]:
    factory = get_session_factory()
    llm = get_llm_provider()
    created: list[str] = []

    async with factory() as session:
        q = select(DocumentChunk)
        if document_id:
            q = q.where(DocumentChunk.document_id == document_id)
        chunks = (await session.execute(q.limit(30))).scalars().all()
        context = "\n\n".join(c.content for c in chunks)[:6000]
        source_ids = list({c.document_id for c in chunks})

        prompt_types = [
            ("trend", "Identify a commerce trend"),
            ("anomaly", "Flag a pricing or catalog anomaly"),
            ("recommendation", "Give a merchandising recommendation"),
            ("summary", "Summarize the key takeaways"),
        ]
        for itype, instruction in prompt_types:
            content = await llm.complete(
                [
                    {
                        "role": "system",
                        "content": "You are a commerce insights analyst. Be concise and actionable.",
                    },
                    {
                        "role": "user",
                        "content": f"{instruction} from this corpus:\n\n{context}",
                    },
                ],
                context=context,
            )
            title = content.split("\n")[0].strip("# *")[:120] or f"{itype.title()} insight"
            iid = new_uuid()
            session.add(
                Insight(
                    id=iid,
                    title=title,
                    content=content,
                    insight_type=itype,
                    confidence=0.82,
                    source_document_ids=source_ids,
                    tags=[itype, "auto"],
                    generated_by="ai-pipeline",
                    owner_id=owner_id,
                )
            )
            created.append(iid)
        await session.commit()
    return created


async def handle_document_process(msg: JobMessage) -> None:
    await process_document(msg.payload["document_id"])


async def handle_insights_generate(msg: JobMessage) -> None:
    await generate_insights(msg.payload.get("document_id"), msg.payload.get("owner_id"))


async def handle_reindex(msg: JobMessage) -> None:
    factory = get_session_factory()
    async with factory() as session:
        docs = (await session.execute(select(Document))).scalars().all()
        ids = [d.id for d in docs]
    for did in ids:
        await process_document(did)


async def register_default_handlers(queue: JobQueue) -> None:
    await queue.register_handler("document.process", handle_document_process)
    await queue.register_handler("insights.generate", handle_insights_generate)
    await queue.register_handler("embeddings.reindex", handle_reindex)
