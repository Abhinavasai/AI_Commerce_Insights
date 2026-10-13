from __future__ import annotations

import asyncio
import logging
import signal

from shared.db.session import init_db
from shared.pipeline_bridge import register_default_handlers
from shared.queue import get_job_queue
from shared.runtime import resolve_runtime_mode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("worker")


async def main() -> None:
    mode = resolve_runtime_mode()
    logger.info("Worker starting mode=%s", mode)
    await init_db()
    queue = get_job_queue()
    await register_default_handlers(queue)
    await queue.start()
    logger.info("Worker consuming jobs")

    stop = asyncio.Event()

    def _stop(*_: object) -> None:
        stop.set()

    try:
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, _stop)
            except NotImplementedError:
                pass
    except Exception:
        pass

    await stop.wait()
    await queue.stop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
