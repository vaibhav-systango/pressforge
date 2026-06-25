from fastapi import APIRouter
from app.routers import health, auth

api_router = APIRouter()

# Register sub-routers (like NestJS controllers/modules)
api_router.include_router(health.router, prefix="/status")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
