from sqlalchemy.orm import Session
from app.models.user import User
from app.services.notification.base import NotificationChannel
from app.providers.email_provider import email_provider
from app.core.constants.email_templates import draft_preview_email


class EmailNotificationChannel(NotificationChannel):

    def send_notification(self, db: Session, recipient: User, payload: dict) -> bool:
        template = draft_preview_email(
            client_name=recipient.fullName,
            workspace_name=payload["workspace_name"],
            post_caption=payload["post_caption"],
            post_platforms=payload["post_platforms"],
            post_image_brief=payload["post_image_brief"],
            review_link=payload["review_link"],
        )
        return email_provider.send(
            to=recipient.email,
            subject=template["subject"],
            html=template["html"],
        )
