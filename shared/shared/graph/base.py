from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class GraphStore(ABC):
    @abstractmethod
    async def upsert_seller(self, seller_id: str, name: str, props: dict | None = None) -> None:
        ...

    @abstractmethod
    async def upsert_product(
        self,
        product_id: str,
        name: str,
        seller_id: str | None = None,
        category_id: str | None = None,
        props: dict | None = None,
    ) -> None:
        ...

    @abstractmethod
    async def upsert_category(self, category_id: str, name: str, props: dict | None = None) -> None:
        ...

    @abstractmethod
    async def link(
        self,
        source_type: str,
        source_id: str,
        rel_type: str,
        target_type: str,
        target_id: str,
        meta: dict | None = None,
    ) -> None:
        ...

    @abstractmethod
    async def query_neighbors(
        self, entity_type: str, entity_id: str, rel_type: str | None = None
    ) -> list[dict[str, Any]]:
        ...

    @abstractmethod
    async def catalog_summary(self) -> dict[str, Any]:
        ...

    @abstractmethod
    async def ensure_schema(self) -> None:
        ...
