from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from shared.models.user import User
from shared.utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_db_session)):
    existing = await session.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name or body.email.split("@")[0],
        role="analyst",
    )
    session.add(user)
    await session.flush()
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role, "email": user.email}),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_db_session)):
    user = await session.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role, "email": user.email}),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, session: AsyncSession = Depends(get_db_session)):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("not refresh")
        user = await session.get(User, payload["sub"])
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return TokenResponse(
        access_token=create_access_token(user.id, {"role": user.role, "email": user.email}),
        refresh_token=create_refresh_token(user.id),
    )
