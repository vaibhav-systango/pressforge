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

        brand_name = data.get("brandName") if data.get("brandName") is not None else workspace.name
        tone = data.get("tone") if data.get("tone") is not None else workspace.tone
        keywords = data.get("keywords") if data.get("keywords") is not None else (workspace.keywords or [])
        target_audience = (
            data.get("targetAudience")
            if data.get("targetAudience") is not None
            else workspace.targetAudience
        )
        brand_voice = (
            data.get("brandVoice") if data.get("brandVoice") is not None else workspace.brandVoice
        )
        description = (
            data.get("description") if data.get("description") is not None else workspace.description
        )
        rules = data.get("rules") if data.get("rules") is not None else (workspace.rules or [])

        return gemini_content_provider.generate_variations(
            prompt=prompt,
            goal=data.get("goal"),
            cta=data.get("cta"),
            visual_style=data.get("visualStyle"),
            platforms=data.get("platforms") or ["instagram"],
            reference_urls=data.get("referenceUrls") or [],
            reference_text=data.get("referenceText"),
            brand_name=brand_name,
            tone=tone,
            keywords=keywords or [],
            target_audience=target_audience,
            brand_voice=brand_voice,
            description=description,
            rules=rules or [],
        )


content_generation_service = ContentGenerationService()
