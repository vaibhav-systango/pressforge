import hashlib
import hmac
import logging
import time
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants.instagram_constants import (
    INSTAGRAM_CONNECT_SCOPES,
    LONG_LIVED_TOKEN_TTL_SECONDS,
    TOKEN_REFRESH_BUFFER_SECONDS,
    InstagramErrorCodes,
)
from app.models.organization_member import OrganizationMember
from app.models.social_account import SocialAccount, SocialAccountStatus, SocialPlatform
from app.models.user import User
from app.repositories.oauth_state_repository import oauth_state_repository
from app.repositories.organization_repository import organization_repository
from app.repositories.social_account_repository import social_account_repository
from app.services.token_encryption_service import token_encryption_service

logger = logging.getLogger(__name__)


class InstagramService:
    PLATFORM = SocialPlatform.INSTAGRAM.value
    PLATFORM_SLUG = "instagram"

    def _callback_redirect_uri(self) -> str:
        return f"{settings.oauth_callback_base}/{self.PLATFORM_SLUG}/callback"

    def _ensure_meta_configured(self) -> None:
        if not settings.META_APP_ID or not settings.META_APP_SECRET:
            raise ValueError(InstagramErrorCodes.META_NOT_CONFIGURED)

    def _graph_base(self) -> str:
        return f"https://graph.facebook.com/{settings.META_API_VERSION}"

    def _oauth_dialog_url(self) -> str:
        return f"https://www.facebook.com/{settings.META_API_VERSION}/dialog/oauth"

    def _verify_org_membership(self, db: Session, user_id: str, organization_id: str) -> None:
        membership = db.query(OrganizationMember).filter(
            OrganizationMember.organizationId == organization_id,
            OrganizationMember.userId == user_id,
        ).first()
        if not membership:
            raise ValueError(InstagramErrorCodes.ORG_MEMBERSHIP_REQUIRED)

    def _resolve_organization_id(self, db: Session, user: User, organization_id: str | None) -> str | None:
        if organization_id:
            self._verify_org_membership(db, user.id, organization_id)
            return organization_id
        if user.accountType == "ORGANIZATION":
            return organization_repository.get_organization_id_for_user(db, user.id)
        return None

    def build_authorization_url(self, db: Session, user: User, organization_id: str | None = None) -> str:
        self._ensure_meta_configured()
        resolved_org_id = self._resolve_organization_id(db, user, organization_id)
        oauth_state = oauth_state_repository.create(
            db,
            user_id=user.id,
            organization_id=resolved_org_id,
        )
        db.commit()

        params = {
            "client_id": settings.META_APP_ID,
            "redirect_uri": self._callback_redirect_uri(),
            "scope": ",".join(INSTAGRAM_CONNECT_SCOPES),
            "response_type": "code",
            "state": oauth_state.state,
        }
        return f"{self._oauth_dialog_url()}?{urlencode(params)}"

    def _exchange_code_for_token(self, code: str) -> dict:
        params = {
            "client_id": settings.META_APP_ID,
            "client_secret": settings.META_APP_SECRET,
            "redirect_uri": self._callback_redirect_uri(),
            "code": code,
        }
        with httpx.Client(timeout=30.0) as client:
            response = client.get(f"{self._graph_base()}/oauth/access_token", params=params)
            response.raise_for_status()
            return response.json()

    def _exchange_for_long_lived_token(self, short_lived_token: str) -> dict:
        params = {
            "grant_type": "fb_exchange_token",
            "client_id": settings.META_APP_ID,
            "client_secret": settings.META_APP_SECRET,
            "fb_exchange_token": short_lived_token,
        }
        with httpx.Client(timeout=30.0) as client:
            response = client.get(f"{self._graph_base()}/oauth/access_token", params=params)
            response.raise_for_status()
            return response.json()

    def _discover_instagram_business_account(self, access_token: str) -> dict | None:
        params = {
            "fields": "id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}",
            "access_token": access_token,
        }
        with httpx.Client(timeout=30.0) as client:
            response = client.get(f"{self._graph_base()}/me/accounts", params=params)
            response.raise_for_status()
            data = response.json()

        for page in data.get("data", []):
            ig_account = page.get("instagram_business_account")
            if ig_account and ig_account.get("id"):
                return {
                    "page_id": page.get("id"),
                    "page_access_token": page.get("access_token"),
                    "ig_id": ig_account.get("id"),
                    "username": ig_account.get("username"),
                    "display_name": ig_account.get("name"),
                    "profile_picture_url": ig_account.get("profile_picture_url"),
                }
        return None

    def handle_oauth_callback(self, db: Session, *, code: str, state: str) -> SocialAccount:
        self._ensure_meta_configured()

        oauth_state = oauth_state_repository.get_valid(db, state)
        if not oauth_state:
            raise ValueError(InstagramErrorCodes.INVALID_OAUTH_STATE)

        try:
            token_data = self._exchange_code_for_token(code)
            short_lived_token = token_data.get("access_token")
            if not short_lived_token:
                raise ValueError(InstagramErrorCodes.TOKEN_EXCHANGE_FAILED)

            long_lived_data = self._exchange_for_long_lived_token(short_lived_token)
            long_lived_token = long_lived_data.get("access_token")
            if not long_lived_token:
                raise ValueError(InstagramErrorCodes.TOKEN_EXCHANGE_FAILED)

            expires_in = long_lived_data.get("expires_in", LONG_LIVED_TOKEN_TTL_SECONDS)
            token_expires_at = int((time.time() + int(expires_in)) * 1000)

            ig_account = self._discover_instagram_business_account(long_lived_token)
            if not ig_account:
                raise ValueError(InstagramErrorCodes.NO_INSTAGRAM_BUSINESS_ACCOUNT)

            page_token = ig_account.get("page_access_token") or long_lived_token
            encrypted_token = token_encryption_service.encrypt(page_token)

            account = social_account_repository.upsert(
                db,
                user_id=oauth_state.userId,
                organization_id=oauth_state.organizationId,
                platform=SocialPlatform.INSTAGRAM.value,
                external_account_id=ig_account["ig_id"],
                username=ig_account.get("username"),
                display_name=ig_account.get("display_name"),
                profile_picture_url=ig_account.get("profile_picture_url"),
                facebook_page_id=ig_account.get("page_id"),
                access_token=encrypted_token,
                token_expires_at=token_expires_at,
                scopes=INSTAGRAM_CONNECT_SCOPES,
            )
            oauth_state_repository.delete(db, oauth_state)
            db.commit()
            db.refresh(account)
            return account
        except httpx.HTTPError as exc:
            logger.error("Meta OAuth HTTP error: %s", exc)
            db.rollback()
            raise ValueError(InstagramErrorCodes.TOKEN_EXCHANGE_FAILED) from exc
        except ValueError:
            db.rollback()
            raise
        except Exception as exc:
            logger.error("Unexpected OAuth callback error: %s", exc)
            db.rollback()
            raise ValueError(InstagramErrorCodes.TOKEN_EXCHANGE_FAILED) from exc

    def list_accounts(
        self,
        db: Session,
        user: User,
        organization_id: str | None = None,
    ) -> list[SocialAccount]:
        resolved_org_id = self._resolve_organization_id(db, user, organization_id)
        return social_account_repository.list_for_user(
            db,
            user_id=user.id,
            organization_id=resolved_org_id,
            platform=self.PLATFORM,
        )

    def get_account(self, db: Session, user: User, account_id: str) -> SocialAccount:
        account = social_account_repository.get_by_id(db, account_id)
        if not account:
            raise ValueError(InstagramErrorCodes.ACCOUNT_NOT_FOUND)
        if account.userId != user.id:
            raise ValueError(InstagramErrorCodes.ACCOUNT_NOT_OWNED)
        if account.platform != self.PLATFORM:
            raise ValueError(InstagramErrorCodes.ACCOUNT_NOT_FOUND)
        return account

    def disconnect_account(self, db: Session, user: User, account_id: str) -> None:
        account = self.get_account(db, user, account_id)
        social_account_repository.delete(db, account)
        db.commit()

    def refresh_expiring_tokens(self, db: Session) -> int:
        threshold_ms = int((time.time() + TOKEN_REFRESH_BUFFER_SECONDS) * 1000)
        accounts = social_account_repository.list_expiring_tokens(
            db,
            before_ms=threshold_ms,
            platform=self.PLATFORM,
        )
        refreshed_count = 0

        for account in accounts:
            try:
                access_token = token_encryption_service.decrypt(account.accessToken)
                refreshed = self._exchange_for_long_lived_token(access_token)
                new_token = refreshed.get("access_token")
                if not new_token:
                    social_account_repository.update_status(db, account, SocialAccountStatus.EXPIRED.value)
                    continue

                expires_in = refreshed.get("expires_in", LONG_LIVED_TOKEN_TTL_SECONDS)
                token_expires_at = int((time.time() + int(expires_in)) * 1000)
                encrypted_token = token_encryption_service.encrypt(new_token)
                social_account_repository.update_token(
                    db,
                    account,
                    access_token=encrypted_token,
                    token_expires_at=token_expires_at,
                )
                refreshed_count += 1
            except Exception as exc:
                logger.error("Background token refresh failed for %s: %s", account.id, exc)
                social_account_repository.update_status(db, account, SocialAccountStatus.EXPIRED.value)

        if accounts:
            db.commit()
        return refreshed_count

    def revoke_account_by_external_id(self, db: Session, external_account_id: str) -> bool:
        account = social_account_repository.get_by_external_account_id(db, external_account_id)
        if not account:
            return False
        social_account_repository.update_status(db, account, SocialAccountStatus.REVOKED.value)
        db.commit()
        return True

    def verify_webhook_signature(self, payload: bytes, signature_header: str | None) -> bool:
        if not settings.META_APP_SECRET or not signature_header:
            return False
        if not signature_header.startswith("sha256="):
            return False
        expected = hmac.new(
            settings.META_APP_SECRET.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()
        received = signature_header.removeprefix("sha256=")
        return hmac.compare_digest(expected, received)

    def to_account_response(self, account: SocialAccount) -> dict:
        return {
            "id": account.id,
            "userId": account.userId,
            "organizationId": account.organizationId,
            "platform": account.platform,
            "externalAccountId": account.externalAccountId,
            "username": account.username,
            "displayName": account.displayName,
            "profilePictureUrl": account.profilePictureUrl,
            "facebookPageId": account.facebookPageId,
            "status": account.status,
            "connectedAt": account.connectedAt,
            "tokenExpiresAt": account.tokenExpiresAt,
        }

    def get_connected_account(
        self,
        db: Session,
        user: User,
        organization_id: str | None = None,
    ) -> SocialAccount:
        resolved_org_id = self._resolve_organization_id(db, user, organization_id)
        account = social_account_repository.get_for_user_context(
            db,
            user_id=user.id,
            organization_id=resolved_org_id,
            platform=self.PLATFORM,
        )
        if not account and user.accountType == "ORG_CLIENT" and resolved_org_id is not None:
            account = social_account_repository.get_for_user_context(
                db,
                user_id=user.id,
                organization_id=None,
                platform=self.PLATFORM,
            )
        if not account:
            raise ValueError(InstagramErrorCodes.ACCOUNT_NOT_CONNECTED)

        if account.status == SocialAccountStatus.REVOKED.value:
            raise ValueError(InstagramErrorCodes.TOKEN_REVOKED)
        if account.status == SocialAccountStatus.EXPIRED.value:
            raise ValueError(InstagramErrorCodes.TOKEN_EXPIRED)
        if account.tokenExpiresAt and account.tokenExpiresAt <= int(time.time() * 1000):
            social_account_repository.update_status(db, account, SocialAccountStatus.EXPIRED.value)
            db.commit()
            raise ValueError(InstagramErrorCodes.TOKEN_EXPIRED)
        if account.status != SocialAccountStatus.ACTIVE.value:
            raise ValueError(InstagramErrorCodes.TOKEN_EXPIRED)

        return account

    def create_ig_media_post(
        self,
        db: Session,
        account: SocialAccount,
        *,
        text: str,
        image_url: str | None = None,
    ) -> str:
        """Publish a container image post to Instagram. Returns external Instagram media ID."""
        caption = (text or "").strip()
        if not caption:
            raise ValueError(InstagramErrorCodes.EMPTY_CAPTION)

        if not image_url:
            raise ValueError(InstagramErrorCodes.IMAGE_REQUIRED)

        access_token = token_encryption_service.decrypt(account.accessToken)
        ig_user_id = account.externalAccountId

        create_media_url = f"{self._graph_base()}/{ig_user_id}/media"
        params = {
            "image_url": image_url,
            "caption": caption,
            "access_token": access_token,
        }

        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(create_media_url, data=params)
                if resp.status_code in (401, 403):
                    social_account_repository.update_status(db, account, SocialAccountStatus.EXPIRED.value)
                    db.commit()
                    raise ValueError(InstagramErrorCodes.TOKEN_EXPIRED)
                if resp.status_code >= 400:
                    logger.error("Instagram media container creation error %s: %s", resp.status_code, resp.text)
                    raise ValueError(InstagramErrorCodes.PUBLISH_FAILED)

                container_data = resp.json()
                creation_id = container_data.get("id")
                if not creation_id:
                    raise ValueError(InstagramErrorCodes.PUBLISH_FAILED)

                publish_media_url = f"{self._graph_base()}/{ig_user_id}/media_publish"
                pub_params = {
                    "creation_id": creation_id,
                    "access_token": access_token,
                }
                pub_resp = client.post(publish_media_url, data=pub_params)
                if pub_resp.status_code >= 400:
                    logger.error("Instagram publish container error %s: %s", pub_resp.status_code, pub_resp.text)
                    raise ValueError(InstagramErrorCodes.PUBLISH_FAILED)

                pub_data = pub_resp.json()
                media_id = pub_data.get("id") or creation_id
                return str(media_id)
        except ValueError:
            raise
        except Exception as exc:
            logger.error("Unexpected Instagram publishing error: %s", exc)
            raise ValueError(InstagramErrorCodes.PUBLISH_FAILED) from exc


instagram_service = InstagramService()
