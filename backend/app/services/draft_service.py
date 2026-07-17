import logging

from sqlalchemy.orm import Session

from app.core.constants.content_constants import DraftErrorCodes
from app.models.draft import Draft
from app.models.user import User, generate_timestamp_ms
from app.repositories.draft_repository import draft_repository
from app.repositories.workspace_repository import workspace_repository
from app.services.workspace_service import workspace_service

logger = logging.getLogger(__name__)


def _history_to_dicts(history: list | None) -> list[dict]:
    if not history:
        return []
    result = []
    for entry in history:
        if hasattr(entry, "model_dump"):
            result.append(entry.model_dump())
        elif isinstance(entry, dict):
            result.append(entry)
        else:
            result.append(dict(entry))
    return result


def _draft_to_dict(draft: Draft) -> dict:
    return {
        "id": draft.id,
        "workspaceId": draft.workspaceId,
        "prompt": draft.prompt,
        "status": draft.status,
        "platform": draft.platform,
        "version": draft.version or 1,
        "scheduledAt": draft.scheduledAt,
        "caption": draft.caption,
        "hashtags": draft.hashtags or [],
        "imageBrief": draft.imageBrief,
        "imageUrl": draft.imageUrl,
        "liCaption": draft.liCaption,
        "liHashtags": draft.liHashtags or [],
        "liImageBrief": draft.liImageBrief,
        "goal": draft.goal,
        "cta": draft.cta,
        "visualStyle": draft.visualStyle,
        "referenceUrls": draft.referenceUrls or [],
        "referenceText": draft.referenceText,
        "history": draft.history or [],
        "publishedAt": draft.publishedAt,
        "externalPostId": draft.externalPostId,
        "publishError": draft.publishError,
        "createdAt": draft.createdAt,
        "updatedAt": draft.updatedAt,
    }


class DraftService:
    def _get_accessible_workspace(self, db: Session, user: User, workspace_id: str):
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(DraftErrorCodes.WORKSPACE_NOT_FOUND)
        if not workspace_service._can_access_workspace(db, user, workspace):
            raise ValueError(DraftErrorCodes.ACCESS_DENIED)
        return workspace

    def list_drafts(
        self, db: Session, user: User, *, workspace_id: str | None = None
    ) -> dict:
        if workspace_id:
            self._get_accessible_workspace(db, user, workspace_id)
            drafts = draft_repository.list_by_workspace(db, workspace_id)
        else:
            listed = workspace_service.list_workspaces(db, user)
            workspace_ids = [w["id"] for w in listed["workspaces"]]
            drafts = draft_repository.list_by_workspaces(db, workspace_ids)
        return {"drafts": [_draft_to_dict(d) for d in drafts]}

    def get_draft(self, db: Session, user: User, draft_id: str) -> dict:
        draft = draft_repository.get_by_id(db, draft_id)
        if not draft:
            raise ValueError(DraftErrorCodes.DRAFT_NOT_FOUND)
        self._get_accessible_workspace(db, user, draft.workspaceId)
        return _draft_to_dict(draft)

    def create_draft(self, db: Session, user: User, data: dict) -> dict:
        workspace_id = data["workspaceId"]
        self._get_accessible_workspace(db, user, workspace_id)
        draft = draft_repository.create(
            db,
            workspaceId=workspace_id,
            prompt=data["prompt"],
            status=data.get("status") or "draft",
            platform=data.get("platform"),
            version=data.get("version") or 1,
            scheduledAt=data.get("scheduledAt"),
            caption=data.get("caption"),
            hashtags=data.get("hashtags") or [],
            imageBrief=data.get("imageBrief"),
            imageUrl=data.get("imageUrl"),
            liCaption=data.get("liCaption"),
            liHashtags=data.get("liHashtags") or [],
            liImageBrief=data.get("liImageBrief"),
            goal=data.get("goal"),
            cta=data.get("cta"),
            visualStyle=data.get("visualStyle"),
            referenceUrls=data.get("referenceUrls") or [],
            referenceText=data.get("referenceText"),
            history=_history_to_dicts(data.get("history")),
        )
        db.commit()
        db.refresh(draft)

        try:
            from app.services.notification_service import notification_service
            notification_service.dispatch_draft_notification(db, draft)
        except Exception as e:
            logger.error("Failed to dispatch draft creation notification: %s", e)

        return _draft_to_dict(draft)

    def update_draft(self, db: Session, user: User, draft_id: str, data: dict) -> dict:
        draft = draft_repository.get_by_id(db, draft_id)
        if not draft:
            raise ValueError(DraftErrorCodes.DRAFT_NOT_FOUND)
        self._get_accessible_workspace(db, user, draft.workspaceId)

        updatable = (
            "prompt",
            "status",
            "platform",
            "version",
            "scheduledAt",
            "caption",
            "hashtags",
            "imageBrief",
            "imageUrl",
            "liCaption",
            "liHashtags",
            "liImageBrief",
            "goal",
            "cta",
            "visualStyle",
            "referenceUrls",
            "referenceText",
            "history",
        )
        updates: dict = {}
        for key in updatable:
            if key not in data:
                continue
            value = data[key]
            if key == "history":
                value = _history_to_dicts(value)
            updates[key] = value

        updates["updatedAt"] = generate_timestamp_ms()
        draft_repository.update(db, draft, **updates)
        db.commit()
        db.refresh(draft)
        return _draft_to_dict(draft)


draft_service = DraftService()
