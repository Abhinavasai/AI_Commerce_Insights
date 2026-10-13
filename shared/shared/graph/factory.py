from __future__ import annotations

from functools import lru_cache

from shared.graph.base import GraphStore
from shared.graph.neo4j_store import Neo4jGraphStore
from shared.graph.sql import SqlGraphStore
from shared.runtime import resolve_runtime_mode


@lru_cache
def get_graph_store() -> GraphStore:
    if resolve_runtime_mode() == "aws":
        try:
            return Neo4jGraphStore()
        except Exception:
            return SqlGraphStore()
    return SqlGraphStore()
