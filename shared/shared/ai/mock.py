from __future__ import annotations

import hashlib
import math
import re
from collections.abc import AsyncIterator
from typing import Any

from shared.ai.base import Embedder, LLMProvider


def _hash_embedding(text: str, dims: int = 384) -> list[float]:
    """Deterministic pseudo-embedding for offline mode."""
    vec = [0.0] * dims
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    if not tokens:
        tokens = ["empty"]
    for tok in tokens:
        h = hashlib.sha256(tok.encode()).digest()
        for i in range(0, len(h), 4):
            idx = int.from_bytes(h[i : i + 4], "big") % dims
            vec[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


class MockEmbedder(Embedder):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [_hash_embedding(t) for t in texts]


class MockLLMProvider(LLMProvider):
    async def complete(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        context = kwargs.get("context", "")
        question = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
        )
        if context:
            snippet = context[:800]
            return (
                f"**Commerce Insight (offline mock)**\n\n"
                f"Based on retrieved catalog and document context for: *{question}*\n\n"
                f"{snippet}\n\n"
                f"_Tip: Set OPENAI_API_KEY for full GPT-4o responses._"
            )
        return (
            f"I don't have enough retrieved context yet for: {question}. "
            "Upload and process documents, then ask again."
        )

    async def stream(
        self, messages: list[dict[str, str]], **kwargs: Any
    ) -> AsyncIterator[str]:
        text = await self.complete(messages, **kwargs)
        # Yield in small chunks to simulate SSE tokens
        words = text.split(" ")
        for i, w in enumerate(words):
            yield w + (" " if i < len(words) - 1 else "")
