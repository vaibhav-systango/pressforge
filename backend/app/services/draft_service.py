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
        self,
        db: Session,
        user: User,
        *,
        workspace_id: str | None = None,
        status: str | None = None,
        search: str | None = None,
        platform: str | None = None,
        page: int = 1,
        limit: int = 10,
    ) -> dict:
        if workspace_id:
            self._get_accessible_workspace(db, user, workspace_id)
            workspace_ids = [workspace_id]
        else:
            listed = workspace_service.list_workspaces(db, user)
            workspace_ids = [w["id"] for w in listed["workspaces"]]

        drafts, total = draft_repository.list_paginated(
            db,
            workspace_ids=workspace_ids,
            status=status,
            search=search,
            platform=platform,
            page=page,
            limit=limit,
        )
        counts = draft_repository.get_status_counts(
            db,
            workspace_ids=workspace_ids,
            search=search,
            platform=platform,
        )

        total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 1

        return {
            "drafts": [_draft_to_dict(d) for d in drafts],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
            "counts": counts,
        }

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

        if draft.status == "pending_approval":
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

        previous_status = draft.status

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

        new_status = updates.get("status")
        if previous_status != "pending_approval" and new_status == "pending_approval":
            try:
                from app.services.notification_service import notification_service
                notification_service.dispatch_draft_notification(db, draft)
            except Exception as e:
                logger.error("Failed to dispatch draft update notification: %s", e)

        return _draft_to_dict(draft)

    def submit_feedback_and_regenerate(
        self, db: Session, user: User, draft_id: str, feedback: str
    ) -> dict:
        """
        Records client feedback in history, calls Gemini for an improved revision,
        and updates the draft in-place (same ID, incremented version).
        """
        from app.repositories.workspace_repository import workspace_repository
        from app.providers.gemini_content_provider import gemini_content_provider

        draft = draft_repository.get_by_id(db, draft_id)
        if not draft:
            raise ValueError(DraftErrorCodes.DRAFT_NOT_FOUND)
        self._get_accessible_workspace(db, user, draft.workspaceId)

        workspace = workspace_repository.get_by_id(db, draft.workspaceId)

        # ── 1. Snapshot current version into history ──────────────────────────
        current_version = draft.version or 1
        feedback_entry = {
            "version": current_version,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "action": "Client Requested Changes",
            "caption": draft.caption,
            "liCaption": draft.liCaption,
            "hashtags": draft.hashtags or [],
            "liHashtags": draft.liHashtags or [],
            "imageBrief": draft.imageBrief,
            "liImageBrief": draft.liImageBrief,
            "imageUrl": draft.imageUrl,
            "feedback": feedback,
        }
        existing_history = _history_to_dicts(draft.history)
        new_history = [feedback_entry] + existing_history

        # ── 2. AI regeneration ────────────────────────────────────────────────
        try:
            result = gemini_content_provider.generate_from_feedback(
                feedback=feedback,
                previous_caption=draft.caption or "",
                previous_li_caption=draft.liCaption,
                previous_image_brief=draft.imageBrief,
                previous_li_image_brief=draft.liImageBrief,
                previous_hashtags=draft.hashtags or [],
                previous_li_hashtags=draft.liHashtags or [],
                previous_image_url=draft.imageUrl,
                brand_name=workspace.name if workspace else None,
                tone=workspace.tone if workspace else None,
                keywords=(workspace.keywords or []) if workspace else [],
                target_audience=workspace.targetAudience if workspace else None,
                brand_voice=workspace.brandVoice if workspace else None,
                description=workspace.description if workspace else None,
                rules=(workspace.rules or []) if workspace else [],
                platforms=[draft.platform] if draft.platform and draft.platform != "both"
                           else ["instagram", "linkedin"],
            )
        except Exception as exc:
            logger.error("AI regeneration failed for draft %s: %s", draft_id, exc)
            raise

        next_version = current_version + 1
        ai_entry = {
            "version": next_version,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "action": "AI Revised Post",
            "caption": result["caption"],
            "liCaption": result["liCaption"],
            "hashtags": result["hashtags"],
            "liHashtags": result["liHashtags"],
            "imageBrief": result["imageBrief"],
            "liImageBrief": result["liImageBrief"],
            "imageUrl": result["imageUrl"],
            "feedback": None,
        }
        new_history = [ai_entry] + new_history

        # ── 3. Update draft in-place ──────────────────────────────────────────
        updates = {
            "status": "pending_approval",
            "version": next_version,
            "caption": result["caption"],
            "hashtags": result["hashtags"],
            "imageBrief": result["imageBrief"],
            "imageUrl": result["imageUrl"],
            "liCaption": result["liCaption"],
            "liHashtags": result["liHashtags"],
            "liImageBrief": result["liImageBrief"],
            "history": new_history,
            "updatedAt": generate_timestamp_ms(),
        }
        draft_repository.update(db, draft, **updates)
        db.commit()
        db.refresh(draft)
        return _draft_to_dict(draft)


draft_service = DraftService()
