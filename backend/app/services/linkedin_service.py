import logging
import time
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants.linkedin_constants import (
    LINKEDIN_CONNECT_SCOPES,
    TOKEN_REFRESH_BUFFER_SECONDS,
    LinkedInErrorCodes,
)
from app.models.organization_member import OrganizationMember
from app.models.social_account import SocialAccount, SocialAccountStatus, SocialPlatform
from app.models.user import User
from app.repositories.oauth_state_repository import oauth_state_repository
from app.repositories.organization_repository import organization_repository
from app.repositories.social_account_repository import social_account_repository
from app.services.token_encryption_service import token_encryption_service

logger = logging.getLogger(__name__)


class LinkedInService:
    PLATFORM = SocialPlatform.LINKEDIN.value
    PLATFORM_SLUG = "linkedin"

    def _callback_redirect_uri(self) -> str:
        return f"{settings.oauth_callback_base}/{self.PLATFORM_SLUG}/callback"

    def _ensure_linkedin_configured(self) -> None:
        if not settings.LINKEDIN_CLIENT_ID or not settings.LINKEDIN_CLIENT_SECRET:
            raise ValueError(LinkedInErrorCodes.LINKEDIN_NOT_CONFIGURED)

    def _verify_org_membership(self, db: Session, user_id: str, organization_id: str) -> None:
        membership = db.query(OrganizationMember).filter(
            OrganizationMember.organizationId == organization_id,
            OrganizationMember.userId == user_id,
        ).first()
        if not membership:
            raise ValueError(LinkedInErrorCodes.ORG_MEMBERSHIP_REQUIRED)

    def _resolve_organization_id(self, db: Session, user: User, organization_id: str | None) -> str | None:
        if organization_id:
            self._verify_org_membership(db, user.id, organization_id)
            return organization_id
        if user.accountType == "ORGANIZATION":
            return organization_repository.get_organization_id_for_user(db, user.id)
        return None

    def build_authorization_url(self, db: Session, user: User, organization_id: str | None = None) -> str:
        self._ensure_linkedin_configured()
        resolved_org_id = self._resolve_organization_id(db, user, organization_id)
        oauth_state = oauth_state_repository.create(
            db,
            user_id=user.id,
            organization_id=resolved_org_id,
        )
        db.commit()

        params = {
            "response_type": "code",
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "redirect_uri": self._callback_redirect_uri(),
            "state": oauth_state.state,
            "scope": " ".join(LINKEDIN_CONNECT_SCOPES),
        }
        return f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"

    def _exchange_code_for_token(self, code: str) -> dict:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self._callback_redirect_uri(),
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "client_secret": settings.LINKEDIN_CLIENT_SECRET,
        }
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            return response.json()

    def _fetch_user_profile(self, access_token: str) -> dict:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    def _resolve_display_name(profile: dict) -> str | None:
        name = profile.get("name")
        if isinstance(name, str):
            cleaned = name.strip()
            if cleaned and "undefined" not in cleaned.lower():
                return cleaned

        parts = [
            part.strip()
            for part in (profile.get("given_name"), profile.get("family_name"))
            if isinstance(part, str) and part.strip() and "undefined" not in part.lower()
        ]
        if parts:
            return " ".join(parts)
        return None

    def handle_oauth_callback(self, db: Session, *, code: str, state: str) -> SocialAccount:
        self._ensure_linkedin_configured()

        oauth_state = oauth_state_repository.get_valid(db, state)
        if not oauth_state:
            raise ValueError(LinkedInErrorCodes.INVALID_OAUTH_STATE)

        try:
            token_data = self._exchange_code_for_token(code)
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValueError(LinkedInErrorCodes.TOKEN_EXCHANGE_FAILED)

            expires_in = token_data.get("expires_in")
            token_expires_at = (
                int((time.time() + int(expires_in)) * 1000) if expires_in else None
            )

            profile = self._fetch_user_profile(access_token)
            external_id = profile.get("sub")
            if not external_id:
                raise ValueError(LinkedInErrorCodes.PROFILE_FETCH_FAILED)

            display_name = self._resolve_display_name(profile)
            encrypted_token = token_encryption_service.encrypt(access_token)

            account = social_account_repository.upsert(
                db,
                user_id=oauth_state.userId,
                organization_id=oauth_state.organizationId,
                platform=SocialPlatform.LINKEDIN.value,
                external_account_id=external_id,
                username=profile.get("email"),
                display_name=display_name,
                profile_picture_url=profile.get("picture"),
                facebook_page_id=None,
                access_token=encrypted_token,
                token_expires_at=token_expires_at,
                scopes=LINKEDIN_CONNECT_SCOPES,
            )
            oauth_state_repository.delete(db, oauth_state)
            db.commit()
            db.refresh(account)
            return account
        except httpx.HTTPError as exc:
            logger.error("LinkedIn OAuth HTTP error: %s", exc)
            db.rollback()
            raise ValueError(LinkedInErrorCodes.TOKEN_EXCHANGE_FAILED) from exc
        except ValueError:
            db.rollback()
            raise
        except Exception as exc:
            logger.error("Unexpected LinkedIn OAuth callback error: %s", exc)
            db.rollback()
            raise ValueError(LinkedInErrorCodes.TOKEN_EXCHANGE_FAILED) from exc

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
            raise ValueError(LinkedInErrorCodes.ACCOUNT_NOT_FOUND)
        if account.userId != user.id:
            raise ValueError(LinkedInErrorCodes.ACCOUNT_NOT_OWNED)
        if account.platform != self.PLATFORM:
            raise ValueError(LinkedInErrorCodes.ACCOUNT_NOT_FOUND)
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
        for account in accounts:
            social_account_repository.update_status(db, account, SocialAccountStatus.EXPIRED.value)
        if accounts:
            db.commit()
        return 0

    def _mark_account_status(self, db: Session, account: SocialAccount, status: str) -> None:
        social_account_repository.update_status(db, account, status)
        db.commit()

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
            raise ValueError(LinkedInErrorCodes.ACCOUNT_NOT_CONNECTED)

        if account.status == SocialAccountStatus.REVOKED.value:
            raise ValueError(LinkedInErrorCodes.TOKEN_REVOKED)
        if account.status == SocialAccountStatus.EXPIRED.value:
            raise ValueError(LinkedInErrorCodes.TOKEN_EXPIRED)
        if account.tokenExpiresAt and account.tokenExpiresAt <= int(time.time() * 1000):
            self._mark_account_status(db, account, SocialAccountStatus.EXPIRED.value)
            raise ValueError(LinkedInErrorCodes.TOKEN_EXPIRED)
        if account.status != SocialAccountStatus.ACTIVE.value:
            raise ValueError(LinkedInErrorCodes.TOKEN_EXPIRED)

        return account

    def _decrypt_token(self, account: SocialAccount) -> str:
        return token_encryption_service.decrypt(account.accessToken)

    def _person_urn(self, account: SocialAccount) -> str:
        return f"urn:li:person:{account.externalAccountId}"

    def _auth_headers(self, access_token: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

    def _handle_linkedin_http_error(
        self,
        db: Session,
        account: SocialAccount,
        response: httpx.Response,
    ) -> None:
        status = response.status_code
        body = (response.text or "")[:500]
        logger.error("LinkedIn API error %s: %s", status, body)

        if status in (401, 403):
            lowered = body.lower()
            if "revok" in lowered or "invalid_token" in lowered:
                self._mark_account_status(db, account, SocialAccountStatus.REVOKED.value)
                raise ValueError(LinkedInErrorCodes.TOKEN_REVOKED)
            self._mark_account_status(db, account, SocialAccountStatus.EXPIRED.value)
            raise ValueError(LinkedInErrorCodes.TOKEN_EXPIRED)

        raise ValueError(LinkedInErrorCodes.PUBLISH_FAILED)

    def _upload_image_asset(
        self,
        db: Session,
        account: SocialAccount,
        access_token: str,
        image_url: str,
    ) -> str:
        person_urn = self._person_urn(account)
        register_payload = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": person_urn,
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent",
                    }
                ],
            }
        }

        with httpx.Client(timeout=60.0) as client:
            register_response = client.post(
                "https://api.linkedin.com/v2/assets?action=registerUpload",
                headers=self._auth_headers(access_token),
                json=register_payload,
            )
            if register_response.status_code >= 400:
                self._handle_linkedin_http_error(db, account, register_response)

            register_data = register_response.json()
            value = register_data.get("value") or {}
            upload_mechanism = value.get("uploadMechanism") or {}
            upload_meta = upload_mechanism.get(
                "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
            ) or {}
            upload_url = upload_meta.get("uploadUrl")
            asset_urn = value.get("asset")
            if not upload_url or not asset_urn:
                raise ValueError(LinkedInErrorCodes.IMAGE_UPLOAD_FAILED)

            image_response = client.get(image_url, follow_redirects=True)
            if image_response.status_code >= 400 or not image_response.content:
                raise ValueError(LinkedInErrorCodes.IMAGE_UPLOAD_FAILED)

            content_type = image_response.headers.get("content-type", "image/jpeg")
            upload_headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": content_type.split(";")[0].strip() or "image/jpeg",
            }
            put_response = client.put(
                upload_url,
                content=image_response.content,
                headers=upload_headers,
            )
            if put_response.status_code >= 400:
                logger.error(
                    "LinkedIn image binary upload failed %s: %s",
                    put_response.status_code,
                    (put_response.text or "")[:300],
                )
                raise ValueError(LinkedInErrorCodes.IMAGE_UPLOAD_FAILED)

            return asset_urn

    def create_ugc_post(
        self,
        db: Session,
        account: SocialAccount,
        *,
        text: str,
        image_url: str | None = None,
    ) -> str:
        """Create a LinkedIn UGC post. Returns the LinkedIn post id/URN."""
        caption = (text or "").strip()
        if not caption:
            raise ValueError(LinkedInErrorCodes.EMPTY_CAPTION)

        access_token = self._decrypt_token(account)
        person_urn = self._person_urn(account)

        share_content: dict = {
            "shareCommentary": {"text": caption},
            "shareMediaCategory": "NONE",
        }

        if image_url:
            try:
                asset_urn = self._upload_image_asset(db, account, access_token, image_url)
                share_content = {
                    "shareCommentary": {"text": caption},
                    "shareMediaCategory": "IMAGE",
                    "media": [
                        {
                            "status": "READY",
                            "description": {"text": caption[:200]},
                            "media": asset_urn,
                            "title": {"text": "Image"},
                        }
                    ],
                }
            except ValueError as exc:
                if str(exc) in (
                    LinkedInErrorCodes.TOKEN_EXPIRED,
                    LinkedInErrorCodes.TOKEN_REVOKED,
                ):
                    raise
                # Fall back to text-only if image upload fails
                logger.warning("LinkedIn image upload failed; publishing text-only: %s", exc)
                share_content = {
                    "shareCommentary": {"text": caption},
                    "shareMediaCategory": "NONE",
                }

        payload = {
            "author": person_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": share_content,
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "https://api.linkedin.com/v2/ugcPosts",
                headers=self._auth_headers(access_token),
                json=payload,
            )
            if response.status_code >= 400:
                self._handle_linkedin_http_error(db, account, response)

            post_id = response.headers.get("x-restli-id") or response.headers.get("X-RestLi-Id")
            if not post_id:
                try:
                    post_id = (response.json() or {}).get("id")
                except Exception:
                    post_id = None
            if not post_id:
                raise ValueError(LinkedInErrorCodes.PUBLISH_FAILED)
            return str(post_id)

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


linkedin_service = LinkedInService()
