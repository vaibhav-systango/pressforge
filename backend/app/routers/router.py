from fastapi import APIRouter
from app.routers import health, auth, onboarding, invitation, uploads, workspace

api_router = APIRouter()

# Register sub-routers (like NestJS controllers/modules)
api_router.include_router(health.router, prefix="/status")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(invitation.router, tags=["invitations"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(workspace.router, prefix="/workspaces", tags=["workspaces"])
