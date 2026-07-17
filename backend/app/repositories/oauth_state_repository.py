import secrets
import time
from sqlalchemy.orm import Session
from app.models.oauth_state import OAuthState
from app.models.user import generate_timestamp_ms
from app.core.constants.social_constants import OAUTH_STATE_TTL_SECONDS


class OAuthStateRepository:

    def create(
        self,
        db: Session,
        *,
        user_id: str,
        organization_id: str | None,
    ) -> OAuthState:
        state = secrets.token_urlsafe(32)
        expires_at = int((time.time() + OAUTH_STATE_TTL_SECONDS) * 1000)
        record = OAuthState(
            state=state,
            userId=user_id,
            organizationId=organization_id,
            expiresAt=expires_at,
        )
        db.add(record)
        db.flush()
        return record

    def get_valid(self, db: Session, state: str) -> OAuthState | None:
        record = db.query(OAuthState).filter(OAuthState.state == state).first()
        if not record:
            return None
        if record.expiresAt < generate_timestamp_ms():
            return None
        return record

    def delete(self, db: Session, record: OAuthState) -> None:
        db.delete(record)
        db.flush()

    def delete_expired(self, db: Session) -> int:
        now = generate_timestamp_ms()
        deleted = (
            db.query(OAuthState)
            .filter(OAuthState.expiresAt < now)
            .delete(synchronize_session=False)
        )
        db.flush()
        return deleted


oauth_state_repository = OAuthStateRepository()
