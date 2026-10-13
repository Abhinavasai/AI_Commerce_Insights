from __future__ import annotations

from abc import ABC, abstractmethod
from typing import BinaryIO


class DocumentStore(ABC):
    @abstractmethod
    async def put(self, key: str, data: bytes | BinaryIO, content_type: str = "") -> str:
        """Store bytes; return storage key."""

    @abstractmethod
    async def get(self, key: str) -> bytes:
        """Read file bytes."""

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...

    @abstractmethod
    async def exists(self, key: str) -> bool:
        ...

    @abstractmethod
    async def presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Download URL (presigned S3 or local file path / API URL)."""
