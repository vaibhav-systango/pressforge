import json
import time
from sqlalchemy.orm import Session
from app.models.social_account import SocialAccount, SocialPlatform, SocialAccountStatus
from app.models.user import generate_timestamp_ms


class SocialAccountRepository:

    def get_by_id(self, db: Session, account_id: str) -> SocialAccount | None:
        return db.query(SocialAccount).filter(SocialAccount.id == account_id).first()

    def list_for_user(
        self,
        db: Session,
        *,
        user_id: str,
        organization_id: str | None = None,
        platform: str = SocialPlatform.INSTAGRAM.value,
    ) -> list[SocialAccount]:
        query = db.query(SocialAccount).filter(
            SocialAccount.userId == user_id,
            SocialAccount.platform == platform,
        )
        if organization_id:
            query = query.filter(SocialAccount.organizationId == organization_id)
        else:
            query = query.filter(SocialAccount.organizationId.is_(None))
        return query.order_by(SocialAccount.connectedAt.desc()).all()

    def get_for_user_context(
        self,
        db: Session,
        *,
        user_id: str,
        organization_id: str | None,
        platform: str = SocialPlatform.INSTAGRAM.value,
    ) -> SocialAccount | None:
        query = db.query(SocialAccount).filter(
            SocialAccount.userId == user_id,
            SocialAccount.platform == platform,
        )
        if organization_id:
            query = query.filter(SocialAccount.organizationId == organization_id)
        else:
            query = query.filter(SocialAccount.organizationId.is_(None))
        return query.first()

    def get_latest_active_for_context(
        self,
        db: Session,
        *,
        organization_id: str | None,
        platform: str = SocialPlatform.INSTAGRAM.value,
    ) -> SocialAccount | None:
        query = db.query(SocialAccount).filter(
            SocialAccount.platform == platform,
            SocialAccount.status == SocialAccountStatus.ACTIVE.value,
        )
        if organization_id:
            query = query.filter(SocialAccount.organizationId == organization_id)
        else:
            query = query.filter(SocialAccount.organizationId.is_(None))
        return query.order_by(SocialAccount.connectedAt.desc()).first()

    def upsert(
        self,
        db: Session,
        *,
        user_id: str,
        organization_id: str | None,
        platform: str,
        external_account_id: str,
        username: str | None,
        display_name: str | None,
        profile_picture_url: str | None,
        facebook_page_id: str | None,
        access_token: str,
        token_expires_at: int | None,
        scopes: list[str],
    ) -> SocialAccount:
        existing = self.get_for_user_context(
            db,
            user_id=user_id,
            organization_id=organization_id,
            platform=platform,
        )
        scopes_json = json.dumps(scopes)
        now = generate_timestamp_ms()

        if existing:
            existing.externalAccountId = external_account_id
            existing.username = username
            existing.displayName = display_name
            existing.profilePictureUrl = profile_picture_url
            existing.facebookPageId = facebook_page_id
            existing.accessToken = access_token
            existing.tokenExpiresAt = token_expires_at
            existing.scopes = scopes_json
            existing.status = SocialAccountStatus.ACTIVE.value
            existing.connectedAt = now
            existing.updatedAt = now
            db.add(existing)
            db.flush()
            return existing

        account = SocialAccount(
            userId=user_id,
            organizationId=organization_id,
            platform=platform,
            externalAccountId=external_account_id,
            username=username,
            displayName=display_name,
            profilePictureUrl=profile_picture_url,
            facebookPageId=facebook_page_id,
            accessToken=access_token,
            tokenExpiresAt=token_expires_at,
            scopes=scopes_json,
            status=SocialAccountStatus.ACTIVE.value,
            connectedAt=now,
        )
        db.add(account)
        db.flush()
        return account

    def update_token(
        self,
        db: Session,
        account: SocialAccount,
        *,
        access_token: str,
        token_expires_at: int | None,
    ) -> SocialAccount:
        account.accessToken = access_token
        account.tokenExpiresAt = token_expires_at
        account.status = SocialAccountStatus.ACTIVE.value
        account.updatedAt = generate_timestamp_ms()
        db.add(account)
        db.flush()
        return account

    def update_status(self, db: Session, account: SocialAccount, status: str) -> SocialAccount:
        account.status = status
        account.updatedAt = generate_timestamp_ms()
        db.add(account)
        db.flush()
        return account

    def delete(self, db: Session, account: SocialAccount) -> None:
        db.delete(account)
        db.flush()

    def list_expiring_tokens(
        self,
        db: Session,
        *,
        before_ms: int,
        platform: str | None = None,
    ) -> list[SocialAccount]:
        query = db.query(SocialAccount).filter(
            SocialAccount.status == SocialAccountStatus.ACTIVE.value,
            SocialAccount.tokenExpiresAt.isnot(None),
            SocialAccount.tokenExpiresAt <= before_ms,
        )
        if platform:
            query = query.filter(SocialAccount.platform == platform)
        return query.all()

    def get_by_external_account_id(self, db: Session, external_account_id: str) -> SocialAccount | None:
        return (
            db.query(SocialAccount)
            .filter(SocialAccount.externalAccountId == external_account_id)
            .first()
        )


social_account_repository = SocialAccountRepository()
