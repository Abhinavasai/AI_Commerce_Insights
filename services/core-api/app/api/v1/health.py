from fastapi import APIRouter

from shared.runtime import resolve_runtime_mode
from shared.config import get_settings

router = APIRouter()


@router.get("/health")
async def health():
    settings = get_settings()
    return {
        "status": "ok",
        "runtime_mode": resolve_runtime_mode(),
        "openai_configured": settings.has_openai,
        "service": "core-api",
    }
