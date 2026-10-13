#!/usr/bin/env python3
"""Create or update an admin user."""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "shared"))

from sqlalchemy import select

from shared.db.session import get_session_factory, init_db
from shared.models.user import User
from shared.utils.auth import hash_password


async def main(email: str, password: str, name: str) -> None:
    await init_db()
    factory = get_session_factory()
    async with factory() as session:
        user = await session.scalar(select(User).where(User.email == email.lower()))
        if user:
            user.hashed_password = hash_password(password)
            user.role = "admin"
            user.full_name = name or user.full_name
            user.is_active = True
        else:
            session.add(
                User(
                    email=email.lower(),
                    hashed_password=hash_password(password),
                    full_name=name or "Admin",
                    role="admin",
                )
            )
        await session.commit()
        print(f"Admin ready: {email}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--email", default="admin@demo.com")
    p.add_argument("--password", default="demo1234")
    p.add_argument("--name", default="Admin")
    args = p.parse_args()
    asyncio.run(main(args.email, args.password, args.name))
