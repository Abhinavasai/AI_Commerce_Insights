from fastapi import APIRouter

from app.api.v1 import chat, health, ingest, insights

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(ingest.router, tags=["ingest"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(insights.router, tags=["insights"])
