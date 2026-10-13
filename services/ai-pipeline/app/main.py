from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from shared.config import get_settings
from shared.db.session import init_db
from shared.runtime import resolve_runtime_mode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-pipeline")


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting ai-pipeline mode=%s", resolve_runtime_mode())
    await init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="AI Commerce Insights — AI Pipeline", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)
    return app


app = create_app()
