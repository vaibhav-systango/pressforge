import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.constants.content_constants import DraftErrorCodes
from app.core.constants.linkedin_constants import LinkedInErrorCodes
from app.models.user import User, generate_timestamp_ms
from app.repositories.draft_repository import draft_repository
from app.services.draft_service import draft_service, _draft_to_dict
from app.services.linkedin_service import linkedin_service

logger = logging.getLogger(__name__)


def _build_linkedin_caption(draft) -> str:
    parts: list[str] = []
    caption = (draft.liCaption or draft.caption or "").strip()
    if caption:
        parts.append(caption)

    hashtags = draft.liHashtags or draft.hashtags or []
    cleaned = []
    for tag in hashtags:
        if not tag:
            continue
        value = str(tag).strip()
        if not value:
            continue
        if not value.startswith("#"):
            value = f"#{value.lstrip('#')}"
        cleaned.append(value)
    if cleaned:
        parts.append(" ".join(cleaned))

    return "\n\n".join(parts).strip()


class PublishService:
    def publish_draft_to_linkedin(
        self,
        db: Session,
        user: User,
        draft_id: str,
        *,
        organization_id: str | None = None,
    ) -> dict:
        draft = draft_repository.get_by_id(db, draft_id)
        if not draft:
            raise ValueError(DraftErrorCodes.DRAFT_NOT_FOUND)

        # Enforce workspace access (raises ACCESS_DENIED / WORKSPACE_NOT_FOUND)
        draft_service._get_accessible_workspace(db, user, draft.workspaceId)

        if draft.status == "published":
            raise ValueError(DraftErrorCodes.ALREADY_PUBLISHED)
        if draft.status != "approved":
            raise ValueError(DraftErrorCodes.NOT_APPROVED)

        caption = _build_linkedin_caption(draft)
        if not caption:
            raise ValueError(LinkedInErrorCodes.EMPTY_CAPTION)

        account = linkedin_service.get_connected_account(
            db,
            user,
            organization_id=organization_id,
        )

        try:
            external_post_id = linkedin_service.create_ugc_post(
                db,
                account,
                text=caption,
                image_url=draft.imageUrl,
            )
        except ValueError:
            raise
        except Exception as exc:
            logger.error("Unexpected LinkedIn publish error: %s", exc)
            raise ValueError(LinkedInErrorCodes.PUBLISH_FAILED) from exc

        now_ms = generate_timestamp_ms()
        history = list(draft.history or [])
        history.append(
            {
                "version": (draft.version or 1) + 1,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "published_linkedin",
                "caption": draft.caption,
                "liCaption": draft.liCaption,
                "feedback": f"Published to LinkedIn ({external_post_id})",
                "hashtags": draft.hashtags or [],
                "liHashtags": draft.liHashtags or [],
                "imageBrief": draft.imageBrief,
                "liImageBrief": draft.liImageBrief,
                "imageUrl": draft.imageUrl,
            }
        )

        draft_repository.update(
            db,
            draft,
            status="published",
            publishedAt=now_ms,
            externalPostId=external_post_id,
            publishError=None,
            history=history,
            version=(draft.version or 1) + 1,
            updatedAt=now_ms,
            scheduledAt=draft.scheduledAt or datetime.now(timezone.utc).isoformat(),
        )
        db.commit()
        db.refresh(draft)

        payload = _draft_to_dict(draft)
        payload["platform"] = draft.platform or "linkedin"
        return {
            "draft": payload,
            "platform": "linkedin",
            "externalPostId": external_post_id,
            "publishedAt": now_ms,
            "message": "Published to LinkedIn successfully.",
        }


publish_service = PublishService()
