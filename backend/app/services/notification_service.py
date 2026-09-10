import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.models.draft import Draft
from app.models.organization_member import OrganizationMember, MemberWorkspace, OrganizationRole
from app.services.notification.email_channel import EmailNotificationChannel
from app.services.notification.telegram_channel import TelegramNotificationChannel

logger = logging.getLogger(__name__)


class NotificationService:

    def __init__(self):
        self._channels = {
            "email": EmailNotificationChannel(),
            "telegram": TelegramNotificationChannel(),
        }
        # Non-blocking thread pool executor for background notification delivery
        from concurrent.futures import ThreadPoolExecutor
        self._executor = ThreadPoolExecutor(max_workers=5)

    def _get_workspace_clients(self, db: Session, workspace_id: str) -> list[User]:
        """Finds all active client users allocated to the workspace."""
        return (
            db.query(User)
            .join(OrganizationMember, OrganizationMember.userId == User.id)
            .join(MemberWorkspace, MemberWorkspace.memberId == OrganizationMember.id)
            .filter(
                MemberWorkspace.workspaceId == workspace_id,
                OrganizationMember.role == OrganizationRole.CLIENT.value,
                User.isActive == True,
                User.isDeleted == False,
            )
            .all()
        )

    def dispatch_draft_notification(self, db: Session, draft: Draft) -> None:
        """Triggers notifications across active channels for new draft reviews."""
        clients = self._get_workspace_clients(db, draft.workspaceId)
        if not clients:
            logger.info(
                "No clients allocated to workspace %s. Skipping notifications.",
                draft.workspaceId,
            )
            return

        # Fetch required attributes synchronously to avoid database session thread unsafety
        workspace_name = draft.workspace.name if draft.workspace else "Your Workspace"
        post_caption = draft.caption or draft.prompt or "No caption preview available"
        post_platforms = draft.platform or "instagram"
        post_image_brief = draft.imageBrief or "No image concept details"
        post_image_url = draft.imageUrl or ""
        draft_id = draft.id

        recipient_users = [
            {"email": client.email, "fullName": client.fullName}
            for client in clients
        ]

        self._executor.submit(
            self._dispatch_background,
            recipient_users,
            workspace_name,
            post_caption,
            post_platforms,
            post_image_brief,
            post_image_url,
            draft_id
        )

    def _dispatch_background(
        self,
        recipients: list[dict],
        workspace_name: str,
        post_caption: str,
        post_platforms: str,
        post_image_brief: str,
        post_image_url: str,
        draft_id: str
    ) -> None:
        payload = {
            "workspace_name": workspace_name,
            "post_caption": post_caption,
            "post_platforms": post_platforms,
            "post_image_brief": post_image_brief,
            "post_image_url": post_image_url,
            "review_link": f"{settings.FRONTEND_URL}/app/approvals/{draft_id}",
        }

        # A database session is not passed to the background thread to ensure safety.
        # SendGrid and Telegram integrations do not require database connections to send.
        for name, channel in self._channels.items():
            for recipient_data in recipients:
                try:
                    client_user = User(
                        email=recipient_data["email"],
                        fullName=recipient_data["fullName"]
                    )
                    success = channel.send_notification(None, client_user, payload)
                    logger.info(
                        "Notification sent via %s to client %s: success=%s",
                        name,
                        client_user.email,
                        success,
                    )
                except Exception as e:
                    logger.error(
                        "Failed to send notification via %s channel to %s: %s",
                        name,
                        recipient_data.get("email"),
                        e,
                    )


notification_service = NotificationService()
