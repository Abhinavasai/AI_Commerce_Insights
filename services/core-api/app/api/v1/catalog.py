from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user, get_db_session
from app.schemas.catalog import CatalogGraphOut, CategoryOut, ProductOut, SellerOut
from shared.graph import get_graph_store
from shared.models.catalog import Category, EntityLink, Product, Seller
from shared.models.user import User

router = APIRouter()


@router.get("/products", response_model=list[ProductOut])
async def list_products(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(Product).options(selectinload(Product.seller), selectinload(Product.category))
    )
    products = result.scalars().all()
    out = []
    for p in products:
        item = ProductOut.model_validate(p)
        item.seller_name = p.seller.name if p.seller else None
        item.category_name = p.category.name if p.category else None
        out.append(item)
    return out


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    result = await session.execute(
        select(Product)
        .options(selectinload(Product.seller), selectinload(Product.category))
        .where(Product.id == product_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    item = ProductOut.model_validate(p)
    item.seller_name = p.seller.name if p.seller else None
    item.category_name = p.category.name if p.category else None
    return item


@router.get("/sellers", response_model=list[SellerOut])
async def list_sellers(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    sellers = (await session.execute(select(Seller))).scalars().all()
    out = []
    for s in sellers:
        count = await session.scalar(
            select(func.count()).select_from(Product).where(Product.seller_id == s.id)
        )
        item = SellerOut.model_validate(s)
        item.product_count = count or 0
        out.append(item)
    return out


@router.get("/sellers/{seller_id}", response_model=SellerOut)
async def get_seller(
    seller_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    s = await session.get(Seller, seller_id)
    if not s:
        raise HTTPException(status_code=404, detail="Seller not found")
    count = await session.scalar(
        select(func.count()).select_from(Product).where(Product.seller_id == s.id)
    )
    item = SellerOut.model_validate(s)
    item.product_count = count or 0
    return item


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    cats = (await session.execute(select(Category))).scalars().all()
    out = []
    for c in cats:
        count = await session.scalar(
            select(func.count()).select_from(Product).where(Product.category_id == c.id)
        )
        item = CategoryOut.model_validate(c)
        item.product_count = count or 0
        out.append(item)
    return out


@router.get("/graph", response_model=CatalogGraphOut)
async def catalog_graph(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    products = (await session.execute(select(Product))).scalars().all()
    sellers = (await session.execute(select(Seller))).scalars().all()
    categories = (await session.execute(select(Category))).scalars().all()
    links = (await session.execute(select(EntityLink).limit(200))).scalars().all()

    nodes = []
    for s in sellers:
        nodes.append({"id": s.id, "label": s.name, "type": "seller"})
    for c in categories:
        nodes.append({"id": c.id, "label": c.name, "type": "category"})
    for p in products[:80]:
        nodes.append({"id": p.id, "label": p.name, "type": "product"})

    edges = []
    for p in products:
        if p.seller_id:
            edges.append(
                {"source": p.seller_id, "target": p.id, "rel": "SELLS"}
            )
        if p.category_id:
            edges.append(
                {"source": p.id, "target": p.category_id, "rel": "BELONGS_TO"}
            )
    for link in links:
        edges.append(
            {
                "source": link.source_id,
                "target": link.target_id,
                "rel": link.rel_type,
            }
        )

    summary = await get_graph_store().catalog_summary()
    return CatalogGraphOut(nodes=nodes, edges=edges, summary=summary)
