from __future__ import annotations

import math
from typing import TypeVar

T = TypeVar("T")


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


def top_k_similar(
    query: list[float],
    items: list[tuple[T, list[float]]],
    k: int = 5,
) -> list[tuple[T, float]]:
    scored = [(item, cosine_similarity(query, emb)) for item, emb in items if emb]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:k]
