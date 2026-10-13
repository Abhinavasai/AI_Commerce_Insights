from __future__ import annotations

from functools import lru_cache

from shared.runtime import resolve_runtime_mode
from shared.storage.base import DocumentStore
from shared.storage.local import LocalDocumentStore
from shared.storage.s3 import S3DocumentStore


@lru_cache
def get_document_store() -> DocumentStore:
    if resolve_runtime_mode() == "aws":
        return S3DocumentStore()
    return LocalDocumentStore()
