from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db_session, require_roles
from app.schemas.auth import RoleUpdate, UserOut, UserUpdate
from shared.models.user import User
from shared.utils.auth import hash_password

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.password:
        user.hashed_password = hash_password(body.password)
    session.add(user)
    await session.flush()
    return user


@router.get("", response_model=list[UserOut])
async def list_users(
    _: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_db_session),
):
    rows = (await session.execute(select(User).order_by(User.email))).scalars().all()
    return rows


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_role(
    user_id: str,
    body: RoleUpdate,
    _: User = Depends(require_roles("admin")),
    session: AsyncSession = Depends(get_db_session),
):
    if body.role not in {"admin", "analyst", "viewer"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    session.add(user)
    await session.flush()
    return user
