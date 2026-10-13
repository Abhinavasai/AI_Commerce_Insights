from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any


@dataclass
class JobMessage:
    job_type: str
    payload: dict[str, Any] = field(default_factory=dict)
    receipt_handle: str | None = None


Handler = Callable[[JobMessage], Awaitable[None]]


class JobQueue(ABC):
    @abstractmethod
    async def publish(self, job_type: str, payload: dict[str, Any]) -> None:
        ...

    @abstractmethod
    async def register_handler(self, job_type: str, handler: Handler) -> None:
        ...

    @abstractmethod
    async def start(self) -> None:
        """Start consuming (no-op for in-process if handlers fire on publish)."""

    @abstractmethod
    async def stop(self) -> None:
        ...
