import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.constants.content_constants import DraftErrorCodes, DraftErrorMessages
from app.core.constants.linkedin_constants import LinkedInErrorCodes, LinkedInErrorMessages
from app.models.draft import Draft
from app.models.user import User, generate_timestamp_ms
from app.repositories.draft_repository import draft_repository
from app.repositories.social_account_repository import social_account_repository
from app.repositories.user_repository import user_repository
from app.repositories.workspace_repository import workspace_repository
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


def _is_due_for_publish(scheduled_at: str | None, now: datetime) -> bool:
    """Ready now if no schedule, or scheduled time has passed."""
    if not scheduled_at or not str(scheduled_at).strip():
        return True
    try:
        parsed = datetime.fromisoformat(str(scheduled_at).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed <= now
    except ValueError:
        # Unparseable schedule — attempt publish rather than block forever
        return True


def _message_for_publish_error(code: str) -> str:
    return (
        getattr(LinkedInErrorMessages, code, None)
        or getattr(DraftErrorMessages, code, None)
        or code
    )


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

        # Check if there is an active client account connected to this workspace
        from app.models.organization_member import OrganizationMember, MemberWorkspace, OrganizationRole
        from app.models.social_account import SocialAccount, SocialAccountStatus

        workspace = workspace_repository.get_by_id(db, draft.workspaceId)
        allocated_client_account = None
        if workspace:
            client_members = db.query(OrganizationMember).filter(
                OrganizationMember.role == OrganizationRole.CLIENT.value,
                (OrganizationMember.workspaceId == workspace.id) |
                OrganizationMember.id.in_(
                    db.query(MemberWorkspace.memberId).filter(MemberWorkspace.workspaceId == workspace.id)
                )
            ).all()

            client_user_ids = [m.userId for m in client_members]
            if client_user_ids:
                allocated_client_account = db.query(SocialAccount).filter(
                    SocialAccount.userId.in_(client_user_ids),
                    SocialAccount.platform == linkedin_service.PLATFORM,
                    SocialAccount.status == SocialAccountStatus.ACTIVE.value
                ).order_by(SocialAccount.connectedAt.desc()).first()

        if allocated_client_account:
            account = allocated_client_account
        else:
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

    def _record_publish_error(self, db: Session, draft: Draft, code: str) -> None:
        message = _message_for_publish_error(code)
        # Re-load so we don't overwrite a concurrent successful publish
        fresh = draft_repository.get_by_id(db, draft.id)
        if not fresh or fresh.status != "approved":
            return
        if fresh.publishError == message:
            return
        draft_repository.update(
            db,
            fresh,
            publishError=message,
            updatedAt=generate_timestamp_ms(),
        )
        db.commit()

    def process_publish_queue(self, db: Session) -> dict:
        """
        Auto-publish approved drafts when a LinkedIn account is connected.

        Rules:
        - Queue = status 'approved'
        - Approved drafts publish immediately; scheduledAt is display metadata only
        - Skip (stay queued) if LinkedIn not connected
        - On success → status 'published' (clears from queue)
        - On failure → stay approved, set publishError for retry next cycle
        """
        candidates = draft_repository.list_approved(db, limit=50)
        published = 0
        skipped = 0
        failed = 0

        for draft in candidates:
            workspace = workspace_repository.get_by_id(db, draft.workspaceId)
            if not workspace or not workspace.ownerUserId:
                skipped += 1
                continue

            # Check if any CLIENT user assigned to this workspace has connected their LinkedIn account
            from app.models.organization_member import OrganizationMember, MemberWorkspace, OrganizationRole
            from app.models.social_account import SocialAccount, SocialAccountStatus

            allocated_client_account = None
            client_members = db.query(OrganizationMember).filter(
                OrganizationMember.role == OrganizationRole.CLIENT.value,
                (OrganizationMember.workspaceId == workspace.id) |
                OrganizationMember.id.in_(
                    db.query(MemberWorkspace.memberId).filter(MemberWorkspace.workspaceId == workspace.id)
                )
            ).all()

            client_user_ids = [m.userId for m in client_members]
            if client_user_ids:
                allocated_client_account = db.query(SocialAccount).filter(
                    SocialAccount.userId.in_(client_user_ids),
                    SocialAccount.platform == linkedin_service.PLATFORM,
                    SocialAccount.status == SocialAccountStatus.ACTIVE.value
                ).order_by(SocialAccount.connectedAt.desc()).first()

            account = None
            if allocated_client_account:
                account = allocated_client_account
            elif workspace.organizationId:
                account = social_account_repository.get_latest_active_for_context(
                    db,
                    organization_id=workspace.organizationId,
                    platform=linkedin_service.PLATFORM,
                )

            publish_user_id = account.userId if account else workspace.ownerUserId
            publish_user = user_repository.get_by_id(db, publish_user_id)
            if not publish_user:
                skipped += 1
                continue

            try:
                self.publish_draft_to_linkedin(
                    db,
                    publish_user,
                    draft.id,
                    organization_id=account.organizationId if account else workspace.organizationId,
                )
                published += 1
                logger.info("Auto-published draft %s to LinkedIn", draft.id)
            except ValueError as exc:
                code = str(exc)
                if code in (
                    LinkedInErrorCodes.ACCOUNT_NOT_CONNECTED,
                    DraftErrorCodes.ALREADY_PUBLISHED,
                    DraftErrorCodes.NOT_APPROVED,
                    DraftErrorCodes.DRAFT_NOT_FOUND,
                ):
                    # Not connected / already handled — leave queue untouched
                    skipped += 1
                    continue
                self._record_publish_error(db, draft, code)
                failed += 1
                logger.warning("Auto-publish failed for draft %s: %s", draft.id, code)
            except Exception as exc:
                logger.error("Unexpected auto-publish error for draft %s: %s", draft.id, exc)
                self._record_publish_error(db, draft, LinkedInErrorCodes.PUBLISH_FAILED)
                failed += 1

        return {"published": published, "skipped": skipped, "failed": failed}


publish_service = PublishService()
