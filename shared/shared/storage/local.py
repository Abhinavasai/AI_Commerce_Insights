from __future__ import annotations

from pathlib import Path
from typing import BinaryIO

from shared.config import get_settings
from shared.storage.base import DocumentStore


class LocalDocumentStore(DocumentStore):
    def __init__(self, root: str | None = None) -> None:
        settings = get_settings()
        self.root = Path(root or settings.local_storage_path)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    async def put(self, key: str, data: bytes | BinaryIO, content_type: str = "") -> str:
        path = self._path(key)
        if isinstance(data, (bytes, bytearray)):
            path.write_bytes(data)
        else:
            path.write_bytes(data.read())
        return key

    async def get(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    async def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            path.unlink()

    async def exists(self, key: str) -> bool:
        return self._path(key).exists()

    async def presigned_url(self, key: str, expires_in: int = 3600) -> str:
        # Local mode: clients download via core-api endpoint
        return f"/api/v1/documents/download-by-key?key={key}"
