import logging

from sqlalchemy.orm import Session

from app.core.constants.content_constants import ContentErrorCodes
from app.models.user import User
from app.providers.gemini_content_provider import gemini_content_provider
from app.repositories.workspace_repository import workspace_repository
from app.services.workspace_service import workspace_service

logger = logging.getLogger(__name__)


class ContentGenerationService:
    def generate(self, db: Session, user: User, data: dict) -> dict:
        prompt = (data.get("prompt") or "").strip()
        if not prompt:
            raise ValueError(ContentErrorCodes.INVALID_PROMPT)

        workspace_id = data.get("workspaceId")
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(ContentErrorCodes.WORKSPACE_NOT_FOUND)
        if not workspace_service._can_access_workspace(db, user, workspace):
            raise ValueError(ContentErrorCodes.ACCESS_DENIED)

        return gemini_content_provider.generate_variations(
            prompt=prompt,
            goal=data.get("goal"),
            cta=data.get("cta"),
            visual_style=data.get("visualStyle"),
            platforms=data.get("platforms") or ["instagram"],
            reference_urls=data.get("referenceUrls") or [],
            reference_text=data.get("referenceText"),
            brand_name=workspace.name,
            tone=workspace.tone,
            keywords=workspace.keywords or [],
            target_audience=workspace.targetAudience,
            brand_voice=workspace.brandVoice,
            description=workspace.description,
        )


content_generation_service = ContentGenerationService()
