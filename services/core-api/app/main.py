from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from shared.config import get_settings
from shared.db.session import init_db
from shared.graph import get_graph_store
from shared.queue import get_job_queue
from shared.runtime import resolve_runtime_mode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("core-api")


async def _register_local_handlers() -> None:
    """In local mode, core-api can process jobs inline via shared handlers."""
    from shared.pipeline_bridge import register_default_handlers

    queue = get_job_queue()
    await register_default_handlers(queue)
    await queue.start()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    mode = resolve_runtime_mode()
    logger.info("Starting core-api in mode=%s", mode)
    await init_db()
    graph = get_graph_store()
    await graph.ensure_schema()
    if mode == "local":
        await _register_local_handlers()
    yield
    await get_job_queue().stop()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="AI Commerce Insights — Core API", version="0.1.0", lifespan=lifespan)
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
