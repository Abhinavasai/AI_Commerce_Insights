#!/usr/bin/env python3
"""Seed local SQLite (or configured DB) with demo commerce data."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "shared"))

from shared.ai.mock import MockEmbedder
from shared.db.session import get_session_factory, init_db
from shared.models.base import new_uuid
from shared.models.catalog import Category, EntityLink, Product, Seller
from shared.models.chat import ChatMessage, ChatSession
from shared.models.document import Document, DocumentChunk
from shared.models.insight import Insight
from shared.models.user import User
from shared.utils.auth import hash_password
from sqlalchemy import select


DEMO_DOCS = [
    {
        "title": "Q3 Electronics Catalog — BrightTech",
        "file_name": "brighttech_q3_electronics.csv",
        "content": """product,seller,category,price,margin
Wireless Earbuds Pro,BrightTech,Electronics,79.99,0.28
USB-C Hub 7-in-1,BrightTech,Electronics,49.99,0.22
4K Webcam,BrightTech,Electronics,129.00,0.18
Mechanical Keyboard,BrightTech,Electronics,89.50,0.31
Seller: BrightTech region NA
Category: Electronics growing 18% QoQ
Compliance: RoHS certified for all SKUs
""",
    },
    {
        "title": "Home & Kitchen Supplier Onboarding — Nestora",
        "file_name": "nestora_onboarding.txt",
        "content": """Seller: Nestora
Category: Home & Kitchen
Product: Ceramic Nonstick Pan Set
Product: Bamboo Cutting Board
Product: Glass Meal Prep Containers
Compliance flags: missing insurance certificate for EU warehouse.
Margins declined 4% QoQ due to freight costs.
Recommendation: renegotiate 3PL rates before holiday peak.
""",
    },
    {
        "title": "Outdoor Competitive Report",
        "file_name": "outdoor_competitive.html",
        "content": """<html><body>
<h1>Outdoor Category Competitive Intelligence</h1>
<p>Seller: TrailPeak lists Product: Ultralight Tent at $249 vs category avg $189 — anomaly.</p>
<p>Seller: CampWise expanding Product: Hiking Poles and Product: Sleeping Bag Ultra.</p>
<p>Category: Outdoor has only 12 active listings but 5 new seller applications mention outdoor SKUs.</p>
</body></html>""",
    },
    {
        "title": "Beauty Catalog Feed — GlowLab",
        "file_name": "glowlab_beauty.csv",
        "content": """product,seller,category,price
Vitamin C Serum,GlowLab,Beauty,34.00
Retinol Night Cream,GlowLab,Beauty,42.50
SPF 50 Moisturizer,GlowLab,Beauty,28.00
Seller: GlowLab
Category: Beauty
Trend: clean-beauty keywords up 40% in Q3 reviews.
""",
    },
    {
        "title": "Compliance Digest — Multi Seller",
        "file_name": "compliance_digest.docx.txt",
        "content": """Q3 onboarding summary: 15 new sellers, 340 products added, 3 compliance flags raised.
Seller: ApexGoods — missing W-9.
Seller: Nestora — EU insurance gap.
Seller: TrailPeak — pricing 3x category average on Ultralight Tent.
Category: Electronics and Category: Outdoor need analyst review this week.
""",
    },
]


async def seed() -> None:
    await init_db()
    factory = get_session_factory()
    embedder = MockEmbedder()

    async with factory() as session:
        existing = await session.scalar(select(User).where(User.email == "admin@demo.com"))
        if existing:
            print("Seed already applied (admin@demo.com exists). Skipping.")
            return

        admin = User(
            id=new_uuid(),
            email="admin@demo.com",
            hashed_password=hash_password("demo1234"),
            full_name="Demo Admin",
            role="admin",
        )
        analyst = User(
            id=new_uuid(),
            email="analyst@demo.com",
            hashed_password=hash_password("demo1234"),
            full_name="Demo Analyst",
            role="analyst",
        )
        viewer = User(
            id=new_uuid(),
            email="viewer@demo.com",
            hashed_password=hash_password("demo1234"),
            full_name="Demo Viewer",
            role="viewer",
        )
        session.add_all([admin, analyst, viewer])

        cats = {
            "Electronics": Category(id=new_uuid(), name="Electronics", description="Consumer electronics"),
            "Home & Kitchen": Category(id=new_uuid(), name="Home & Kitchen", description="Home goods"),
            "Outdoor": Category(id=new_uuid(), name="Outdoor", description="Outdoor & camping"),
            "Beauty": Category(id=new_uuid(), name="Beauty", description="Beauty & personal care"),
        }
        session.add_all(list(cats.values()))

        sellers = {
            "BrightTech": Seller(id=new_uuid(), name="BrightTech", region="NA", meta={"tier": "gold"}),
            "Nestora": Seller(id=new_uuid(), name="Nestora", region="EU", meta={"tier": "silver"}),
            "TrailPeak": Seller(id=new_uuid(), name="TrailPeak", region="NA", meta={"tier": "bronze"}),
            "CampWise": Seller(id=new_uuid(), name="CampWise", region="NA", meta={"tier": "silver"}),
            "GlowLab": Seller(id=new_uuid(), name="GlowLab", region="APAC", meta={"tier": "gold"}),
            "ApexGoods": Seller(id=new_uuid(), name="ApexGoods", region="NA", meta={"tier": "bronze"}),
        }
        session.add_all(list(sellers.values()))

        products_spec = [
            ("Wireless Earbuds Pro", "BrightTech", "Electronics", 79.99),
            ("USB-C Hub 7-in-1", "BrightTech", "Electronics", 49.99),
            ("4K Webcam", "BrightTech", "Electronics", 129.0),
            ("Ceramic Nonstick Pan Set", "Nestora", "Home & Kitchen", 89.0),
            ("Bamboo Cutting Board", "Nestora", "Home & Kitchen", 24.0),
            ("Ultralight Tent", "TrailPeak", "Outdoor", 249.0),
            ("Hiking Poles", "CampWise", "Outdoor", 59.0),
            ("Sleeping Bag Ultra", "CampWise", "Outdoor", 119.0),
            ("Vitamin C Serum", "GlowLab", "Beauty", 34.0),
            ("Retinol Night Cream", "GlowLab", "Beauty", 42.5),
            ("SPF 50 Moisturizer", "GlowLab", "Beauty", 28.0),
        ]
        product_ids = []
        for name, sname, cname, price in products_spec:
            pid = new_uuid()
            product_ids.append(pid)
            session.add(
                Product(
                    id=pid,
                    name=name,
                    sku=f"SKU-{pid[:8].upper()}",
                    price=price,
                    seller_id=sellers[sname].id,
                    category_id=cats[cname].id,
                    attributes={"seed": True},
                )
            )
            session.add(
                EntityLink(
                    id=new_uuid(),
                    source_type="Seller",
                    source_id=sellers[sname].id,
                    rel_type="SELLS",
                    target_type="Product",
                    target_id=pid,
                )
            )
            session.add(
                EntityLink(
                    id=new_uuid(),
                    source_type="Product",
                    source_id=pid,
                    rel_type="BELONGS_TO",
                    target_type="Category",
                    target_id=cats[cname].id,
                )
            )

        doc_ids = []
        for spec in DEMO_DOCS:
            did = new_uuid()
            doc_ids.append(did)
            # Write file to local storage
            storage_root = ROOT / "storage" / "uploads" / "raw"
            storage_root.mkdir(parents=True, exist_ok=True)
            key = f"raw/{did}.txt"
            (ROOT / "storage" / "uploads" / key).parent.mkdir(parents=True, exist_ok=True)
            (ROOT / "storage" / "uploads" / key).write_text(spec["content"], encoding="utf-8")

            session.add(
                Document(
                    id=did,
                    title=spec["title"],
                    file_name=spec["file_name"],
                    file_type="text/plain",
                    file_size=len(spec["content"]),
                    storage_key=key,
                    status="completed",
                    chunk_count=0,
                    owner_id=analyst.id,
                    meta={"seeded": True},
                )
            )
            # chunks
            pieces = [spec["content"][i : i + 500] for i in range(0, len(spec["content"]), 450)]
            embeddings = await embedder.embed(pieces)
            for idx, (content, emb) in enumerate(zip(pieces, embeddings)):
                session.add(
                    DocumentChunk(
                        id=new_uuid(),
                        document_id=did,
                        chunk_index=idx,
                        content=content,
                        embedding=emb,
                        token_count=len(content.split()),
                    )
                )
            # update chunk_count via flush later — set now
            # Document already added; update after
        await session.flush()
        for did, spec in zip(doc_ids, DEMO_DOCS):
            doc = await session.get(Document, did)
            pieces = [spec["content"][i : i + 500] for i in range(0, len(spec["content"]), 450)]
            if doc:
                doc.chunk_count = len(pieces)

        insights = [
            Insight(
                id=new_uuid(),
                title="Electronics margin expansion at BrightTech",
                content="BrightTech's product count in Electronics shows strong margins (up to 31% on Mechanical Keyboard). Wireless accessories are leading volume.",
                insight_type="trend",
                confidence=0.88,
                source_document_ids=doc_ids[:1],
                tags=["electronics", "margins"],
                generated_by="seed",
                owner_id=analyst.id,
            ),
            Insight(
                id=new_uuid(),
                title="TrailPeak tent priced 3x category average",
                content="Document from TrailPeak lists Ultralight Tent at $249 versus outdoor category peers near $189 — flagged as pricing anomaly.",
                insight_type="anomaly",
                confidence=0.91,
                source_document_ids=doc_ids[2:3],
                tags=["outdoor", "pricing"],
                generated_by="seed",
                owner_id=analyst.id,
            ),
            Insight(
                id=new_uuid(),
                title="Expand Outdoor category coverage",
                content="Consider expanding the Outdoor category — multiple seller applications mention outdoor products but the category has limited active listings.",
                insight_type="recommendation",
                confidence=0.84,
                source_document_ids=doc_ids[2:4],
                tags=["outdoor", "assortment"],
                generated_by="seed",
                owner_id=analyst.id,
            ),
            Insight(
                id=new_uuid(),
                title="Q3 onboarding summary",
                content="Q3 onboarding: 15 new sellers, 340 products added, 3 compliance flags raised (ApexGoods W-9, Nestora EU insurance, TrailPeak pricing).",
                insight_type="summary",
                confidence=0.93,
                source_document_ids=doc_ids[4:],
                tags=["compliance", "onboarding"],
                generated_by="seed",
                owner_id=analyst.id,
            ),
        ]
        session.add_all(insights)

        cs = ChatSession(id=new_uuid(), title="Which sellers lead Electronics?", user_id=analyst.id)
        session.add(cs)
        await session.flush()
        session.add_all(
            [
                ChatMessage(
                    id=new_uuid(),
                    session_id=cs.id,
                    role="user",
                    content="Which sellers have the most products in Electronics?",
                    token_count=10,
                ),
                ChatMessage(
                    id=new_uuid(),
                    session_id=cs.id,
                    role="assistant",
                    content="Based on the catalog graph, **BrightTech** leads Electronics with earbuds, hubs, webcams, and keyboards. Margins look healthy on accessories.",
                    token_count=30,
                ),
            ]
        )

        await session.commit()
        print("Seed complete.")
        print("  admin@demo.com / demo1234")
        print("  analyst@demo.com / demo1234")
        print("  viewer@demo.com / demo1234")


if __name__ == "__main__":
    asyncio.run(seed())
