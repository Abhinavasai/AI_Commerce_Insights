from fastapi import APIRouter

from shared.config import get_settings
from shared.runtime import resolve_runtime_mode

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ai-pipeline",
        "runtime_mode": resolve_runtime_mode(),
        "openai_configured": get_settings().has_openai,
    }
