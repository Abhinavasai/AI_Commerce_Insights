from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any


class Embedder(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        ...


class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        ...

    @abstractmethod
    async def stream(
        self, messages: list[dict[str, str]], **kwargs: Any
    ) -> AsyncIterator[str]:
        ...
        yield ""  # pragma: no cover
