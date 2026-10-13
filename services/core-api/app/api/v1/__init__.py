from fastapi import APIRouter

from app.api.v1 import auth, users, documents, insights, catalog, chat, health, dashboard

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
