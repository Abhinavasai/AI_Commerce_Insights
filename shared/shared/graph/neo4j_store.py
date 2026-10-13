from __future__ import annotations

from typing import Any

from neo4j import AsyncGraphDatabase

from shared.config import get_settings
from shared.graph.base import GraphStore


class Neo4jGraphStore(GraphStore):
    def __init__(self) -> None:
        settings = get_settings()
        self._driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )

    async def ensure_schema(self) -> None:
        async with self._driver.session() as session:
            await session.run(
                "CREATE CONSTRAINT seller_id IF NOT EXISTS FOR (s:Seller) REQUIRE s.id IS UNIQUE"
            )
            await session.run(
                "CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE"
            )
            await session.run(
                "CREATE CONSTRAINT category_id IF NOT EXISTS FOR (c:Category) REQUIRE c.id IS UNIQUE"
            )

    async def upsert_seller(self, seller_id: str, name: str, props: dict | None = None) -> None:
        async with self._driver.session() as session:
            await session.run(
                """
                MERGE (s:Seller {id: $id})
                SET s.name = $name, s += $props
                """,
                id=seller_id,
                name=name,
                props=props or {},
            )

    async def upsert_category(
        self, category_id: str, name: str, props: dict | None = None
    ) -> None:
        async with self._driver.session() as session:
            await session.run(
                """
                MERGE (c:Category {id: $id})
                SET c.name = $name, c += $props
                """,
                id=category_id,
                name=name,
                props=props or {},
            )

    async def upsert_product(
        self,
        product_id: str,
        name: str,
        seller_id: str | None = None,
        category_id: str | None = None,
        props: dict | None = None,
    ) -> None:
        async with self._driver.session() as session:
            await session.run(
                """
                MERGE (p:Product {id: $id})
                SET p.name = $name, p += $props
                """,
                id=product_id,
                name=name,
                props=props or {},
            )
            if seller_id:
                await session.run(
                    """
                    MATCH (p:Product {id: $pid}), (s:Seller {id: $sid})
                    MERGE (s)-[:SELLS]->(p)
                    """,
                    pid=product_id,
                    sid=seller_id,
                )
            if category_id:
                await session.run(
                    """
                    MATCH (p:Product {id: $pid}), (c:Category {id: $cid})
                    MERGE (p)-[:BELONGS_TO]->(c)
                    """,
                    pid=product_id,
                    cid=category_id,
                )

    async def link(
        self,
        source_type: str,
        source_id: str,
        rel_type: str,
        target_type: str,
        target_id: str,
        meta: dict | None = None,
    ) -> None:
        # Safe label/rel interpolation from controlled callers
        query = f"""
        MERGE (a:{source_type} {{id: $sid}})
        MERGE (b:{target_type} {{id: $tid}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r += $meta
        """
        async with self._driver.session() as session:
            await session.run(
                query, sid=source_id, tid=target_id, meta=meta or {}
            )

    async def query_neighbors(
        self, entity_type: str, entity_id: str, rel_type: str | None = None
    ) -> list[dict[str, Any]]:
        rel = f":{rel_type}" if rel_type else ""
        query = f"""
        MATCH (a:{entity_type} {{id: $id}})-[r{rel}]->(b)
        RETURN type(r) AS rel_type, labels(b)[0] AS target_type, b.id AS target_id, properties(r) AS meta
        """
        async with self._driver.session() as session:
            result = await session.run(query, id=entity_id)
            return [dict(r) async for r in result]

    async def catalog_summary(self) -> dict[str, Any]:
        async with self._driver.session() as session:
            products = await session.run("MATCH (p:Product) RETURN count(p) AS c")
            sellers = await session.run("MATCH (s:Seller) RETURN count(s) AS c")
            categories = await session.run("MATCH (c:Category) RETURN count(c) AS c")
            links = await session.run("MATCH ()-[r]->() RETURN count(r) AS c")
            return {
                "products": (await products.single())["c"],
                "sellers": (await sellers.single())["c"],
                "categories": (await categories.single())["c"],
                "relationships": (await links.single())["c"],
            }
