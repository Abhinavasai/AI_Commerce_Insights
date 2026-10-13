from __future__ import annotations

import asyncio
import logging
from typing import Any

from shared.queue.base import Handler, JobMessage, JobQueue

logger = logging.getLogger(__name__)


class InProcessJobQueue(JobQueue):
    """Immediate async execution — used when AWS/SQS is unavailable."""

    def __init__(self) -> None:
        self._handlers: dict[str, Handler] = {}
        self._running = False

    async def publish(self, job_type: str, payload: dict[str, Any]) -> None:
        handler = self._handlers.get(job_type)
        msg = JobMessage(job_type=job_type, payload=payload)
        if handler is None:
            logger.warning("No handler for job_type=%s; dropping", job_type)
            return
        asyncio.create_task(self._run(handler, msg))

    async def _run(self, handler: Handler, msg: JobMessage) -> None:
        try:
            await handler(msg)
        except Exception:
            logger.exception("Job failed: %s", msg.job_type)

    async def register_handler(self, job_type: str, handler: Handler) -> None:
        self._handlers[job_type] = handler

    async def start(self) -> None:
        self._running = True

    async def stop(self) -> None:
        self._running = False
