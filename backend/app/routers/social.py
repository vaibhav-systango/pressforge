import logging
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.constants.social_constants import SocialErrorCodes, SocialErrorMessages
from app.core.constants.instagram_constants import InstagramErrorCodes, InstagramErrorMessages
from app.core.constants.linkedin_constants import LinkedInErrorCodes, LinkedInErrorMessages
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.social import ConnectResponse, SocialAccountResponse, SocialConnectionResponse
from app.services.social_platform_registry import get_social_platform_service, normalize_platform_slug

logger = logging.getLogger(__name__)
router = APIRouter()


_PLATFORM_ERROR_MESSAGES = {
    "linkedin": LinkedInErrorMessages,
    "instagram": InstagramErrorMessages,
}


def _social_http_exception(code: str, platform: str | None = None) -> HTTPException:
    status_code = status.HTTP_400_BAD_REQUEST
    if code == SocialErrorCodes.UNSUPPORTED_PLATFORM:
        status_code = status.HTTP_404_NOT_FOUND
    elif code in (InstagramErrorCodes.ACCOUNT_NOT_FOUND, LinkedInErrorCodes.ACCOUNT_NOT_FOUND):
        status_code = status.HTTP_404_NOT_FOUND
    elif code in (InstagramErrorCodes.ACCOUNT_NOT_OWNED, LinkedInErrorCodes.ACCOUNT_NOT_OWNED):
        status_code = status.HTTP_403_FORBIDDEN
    elif code in (InstagramErrorCodes.META_NOT_CONFIGURED, LinkedInErrorCodes.LINKEDIN_NOT_CONFIGURED):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    platform_slug = normalize_platform_slug(platform) if platform else None
    platform_messages = _PLATFORM_ERROR_MESSAGES.get(platform_slug or "")

    message = getattr(SocialErrorMessages, code, None)
    if message is None and platform_messages is not None:
        message = getattr(platform_messages, code, None)
    if message is None:
        # Fallback only when platform is unknown (e.g. unsupported slug).
        message = (
            getattr(LinkedInErrorMessages, code, None)
            or getattr(InstagramErrorMessages, code, None)
            or "An unexpected error occurred."
        )
    return HTTPException(status_code=status_code, detail=message)


def _resolve_service(platform: str):
    try:
        return get_social_platform_service(platform), normalize_platform_slug(platform)
    except ValueError as exc:
        raise _social_http_exception(str(exc), platform) from exc


@router.get(
    "/{platform}/connect",
    response_model=ConnectResponse,
    summary="Start social platform OAuth flow",
)
async def connect_platform(
    platform: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service, platform_slug = _resolve_service(platform)
    try:
        authorization_url = service.build_authorization_url(
            db,
            current_user,
            organization_id=organizationId,
        )
        return {"authorizationUrl": authorization_url, "platform": platform_slug}
    except ValueError as exc:
        raise _social_http_exception(str(exc), platform_slug) from exc


@router.get(
    "/{platform}/callback",
    summary="Social platform OAuth callback",
    include_in_schema=False,
)
async def platform_oauth_callback(
    platform: str,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_reason: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    service, platform_slug = _resolve_service(platform)

    if error:
        logger.warning("%s OAuth denied: %s (%s)", platform_slug, error, error_reason)
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/app/settings?platform={platform_slug}&status=error&reason={error}",
            status_code=status.HTTP_302_FOUND,
        )

    if not code or not state:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/app/settings?platform={platform_slug}&status=error&reason=missing_params",
            status_code=status.HTTP_302_FOUND,
        )

    try:
        account = service.handle_oauth_callback(db, code=code, state=state)
        username = account.displayName or account.username or account.externalAccountId
        safe_username = quote(str(username), safe="")
        return RedirectResponse(
            url=(
                f"{settings.FRONTEND_URL}/app/settings"
                f"?platform={platform_slug}&status=connected&username={safe_username}"
            ),
            status_code=status.HTTP_302_FOUND,
        )
    except ValueError as exc:
        code_value = str(exc)
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/app/settings?platform={platform_slug}&status=error&reason={code_value}",
            status_code=status.HTTP_302_FOUND,
        )


@router.get(
    "/{platform}/connection",
    response_model=SocialConnectionResponse,
    summary="Get the current user's social account connection status",
)
async def get_social_connection(
    platform: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service, platform_slug = _resolve_service(platform)
    try:
        accounts = service.list_accounts(db, current_user, organization_id=organizationId)
        account = accounts[0] if accounts else None
        return {
            "platform": platform_slug,
            "connected": account is not None,
            "account": service.to_account_response(account) if account else None,
        }
    except ValueError as exc:
        raise _social_http_exception(str(exc), platform_slug) from exc


@router.get(
    "/{platform}/accounts",
    response_model=list[SocialAccountResponse],
    summary="List connected social accounts",
)
async def list_social_accounts(
    platform: str,
    organizationId: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service, platform_slug = _resolve_service(platform)
    try:
        accounts = service.list_accounts(db, current_user, organization_id=organizationId)
        return [service.to_account_response(account) for account in accounts]
    except ValueError as exc:
        raise _social_http_exception(str(exc), platform_slug) from exc


@router.delete(
    "/{platform}/accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Disconnect a social account",
)
async def disconnect_social_account(
    platform: str,
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service, platform_slug = _resolve_service(platform)
    try:
        service.disconnect_account(db, current_user, account_id)
    except ValueError as exc:
        raise _social_http_exception(str(exc), platform_slug) from exc
