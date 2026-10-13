from __future__ import annotations

from functools import lru_cache

from shared.ai.base import Embedder, LLMProvider
from shared.ai.mock import MockEmbedder, MockLLMProvider
from shared.ai.openai_provider import OpenAIEmbedder, OpenAILLMProvider
from shared.config import get_settings


@lru_cache
def get_embedder() -> Embedder:
    if get_settings().has_openai:
        return OpenAIEmbedder()
    return MockEmbedder()


@lru_cache
def get_llm_provider() -> LLMProvider:
    if get_settings().has_openai:
        return OpenAILLMProvider()
    return MockLLMProvider()
