from fastapi import APIRouter
from app.routers import health

api_router = APIRouter()

# Register sub-routers (like NestJS controllers/modules)
api_router.include_router(health.router, prefix="/status")
