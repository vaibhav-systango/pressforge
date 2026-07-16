import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.notification.base import NotificationChannel

logger = logging.getLogger(__name__)


class TelegramNotificationChannel(NotificationChannel):

    def send_notification(self, db: Session, recipient: User, payload: dict) -> bool:
        # Placeholder for future Telegram bot implementation
        # e.g., fetching client's registered telegram chat_id from user settings
        logger.info(
            "Telegram notification placeholder triggered for user %s (ID: %s). "
            "Payload: %s",
            recipient.email,
            recipient.id,
            payload,
        )
        return True
