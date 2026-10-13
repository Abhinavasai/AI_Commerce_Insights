from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from openai import AsyncOpenAI

from shared.ai.base import Embedder, LLMProvider
from shared.config import get_settings


class OpenAIEmbedder(Embedder):
    def __init__(self) -> None:
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_embedding_model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        # Batch in chunks of 100
        out: list[list[float]] = []
        for i in range(0, len(texts), 100):
            batch = texts[i : i + 100]
            resp = await self.client.embeddings.create(model=self.model, input=batch)
            out.extend([d.embedding for d in resp.data])
        return out


class OpenAILLMProvider(LLMProvider):
    def __init__(self) -> None:
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_chat_model

    async def complete(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        resp = await self.client.chat.completions.create(
            model=self.model, messages=messages, temperature=kwargs.get("temperature", 0.2)
        )
        return resp.choices[0].message.content or ""

    async def stream(
        self, messages: list[dict[str, str]], **kwargs: Any
    ) -> AsyncIterator[str]:
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=kwargs.get("temperature", 0.2),
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
