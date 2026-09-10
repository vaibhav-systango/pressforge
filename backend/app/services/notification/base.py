from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from app.models.user import User


class NotificationChannel(ABC):

    @abstractmethod
    def send_notification(self, db: Session, recipient: User, payload: dict) -> bool:
        """Sends a notification to a specific recipient user."""
        pass
