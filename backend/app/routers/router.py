from fastapi import APIRouter
from app.routers import health, auth, onboarding

api_router = APIRouter()

# Register sub-routers (like NestJS controllers/modules)
api_router.include_router(health.router, prefix="/status")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
