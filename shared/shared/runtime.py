"""Runtime mode detection and adapter factories."""

from __future__ import annotations

import os
from enum import Enum
from functools import lru_cache
from typing import Literal

from shared.config import get_settings


class RuntimeMode(str, Enum):
    AUTO = "auto"
    AWS = "aws"
    LOCAL = "local"


def _has_aws_credentials() -> bool:
    if os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
        return True
    if os.getenv("AWS_PROFILE"):
        return True
    # ECS / instance role metadata hint
    if os.getenv("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI") or os.getenv(
        "AWS_EXECUTION_ENV"
    ):
        return True
    return False


@lru_cache
def resolve_runtime_mode() -> Literal["aws", "local"]:
    settings = get_settings()
    mode = (settings.runtime_mode or "auto").lower()
    if mode == RuntimeMode.AWS.value:
        return "aws"
    if mode == RuntimeMode.LOCAL.value:
        return "local"
    # auto
    return "aws" if _has_aws_credentials() else "local"


def is_local_mode() -> bool:
    return resolve_runtime_mode() == "local"


def is_aws_mode() -> bool:
    return resolve_runtime_mode() == "aws"
