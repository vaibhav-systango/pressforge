from fastapi import APIRouter
from app.routers import auth, health, invitation, onboarding, social, uploads, webhooks, workspace, content, drafts, stats

api_router = APIRouter()

# Register sub-routers
api_router.include_router(health.router, prefix="/status")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(invitation.router, tags=["invitations"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(workspace.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(drafts.router, prefix="/drafts", tags=["drafts"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
