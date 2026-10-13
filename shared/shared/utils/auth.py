from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from shared.config import get_settings

_PBKDF2_ITERS = 120_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERS
    ).hex()
    return f"pbkdf2_sha256${_PBKDF2_ITERS}${salt}${digest}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        algo, iters_s, salt, digest = hashed.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        iters = int(iters_s)
        check = hashlib.pbkdf2_hmac(
            "sha256", plain.encode("utf-8"), salt.encode("utf-8"), iters
        ).hex()
        return hmac.compare_digest(check, digest)
    except Exception:
        return False


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    payload = {
        "sub": subject,
        "type": "access",
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.access_token_expire_minutes),
        **(extra or {}),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    payload = {
        "sub": subject,
        "type": "refresh",
        "exp": datetime.now(timezone.utc)
        + timedelta(days=settings.refresh_token_expire_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
