from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ProductOut(BaseModel):
    id: str
    name: str
    sku: str
    price: float
    attributes: dict[str, Any] = {}
    seller_id: str | None = None
    category_id: str | None = None
    seller_name: str | None = None
    category_name: str | None = None

    model_config = {"from_attributes": True}


class SellerOut(BaseModel):
    id: str
    name: str
    region: str
    meta: dict[str, Any] = {}
    product_count: int = 0

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: str
    name: str
    description: str
    product_count: int = 0

    model_config = {"from_attributes": True}


class CatalogGraphOut(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    summary: dict[str, Any]
