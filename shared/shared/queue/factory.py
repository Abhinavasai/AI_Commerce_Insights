from __future__ import annotations

from functools import lru_cache

from shared.queue.base import JobQueue
from shared.queue.local import InProcessJobQueue
from shared.queue.sqs import SqsJobQueue
from shared.runtime import resolve_runtime_mode

_queue: JobQueue | None = None


def get_job_queue() -> JobQueue:
    global _queue
    if _queue is None:
        if resolve_runtime_mode() == "aws":
            _queue = SqsJobQueue()
        else:
            _queue = InProcessJobQueue()
    return _queue
