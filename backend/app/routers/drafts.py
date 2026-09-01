from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.constants.content_constants import DraftErrorCodes, DraftErrorMessages
from app.schemas.draft import (
    CreateDraftRequest,
    UpdateDraftRequest,
    SubmitFeedbackRequest,
    DraftResponse,
    DraftListResponse,
    PublishDraftResponse,
)
from app.services.draft_service import draft_service
from app.services.publish_service import publish_service
from app.core.constants.linkedin_constants import LinkedInErrorCodes, LinkedInErrorMessages

logger = logging.getLogger(__name__)
router = APIRouter()

_DRAFT_ERROR_MAP = {
    DraftErrorCodes.DRAFT_NOT_FOUND: (
        status.HTTP_404_NOT_FOUND,
        DraftErrorMessages.DRAFT_NOT_FOUND,
    ),
    DraftErrorCodes.WORKSPACE_NOT_FOUND: (
        status.HTTP_404_NOT_FOUND,
        DraftErrorMessages.WORKSPACE_NOT_FOUND,
    ),
    DraftErrorCodes.ACCESS_DENIED: (
        status.HTTP_403_FORBIDDEN,
        DraftErrorMessages.ACCESS_DENIED,
    ),
    DraftErrorCodes.INVALID_PAYLOAD: (
        status.HTTP_400_BAD_REQUEST,
        DraftErrorMessages.INVALID_PAYLOAD,
    ),
    DraftErrorCodes.NOT_APPROVED: (
        status.HTTP_400_BAD_REQUEST,
        DraftErrorMessages.NOT_APPROVED,
    ),
    DraftErrorCodes.ALREADY_PUBLISHED: (
        status.HTTP_400_BAD_REQUEST,
        DraftErrorMessages.ALREADY_PUBLISHED,
    ),
}

_LINKEDIN_PUBLISH_ERROR_MAP = {
    LinkedInErrorCodes.ACCOUNT_NOT_CONNECTED: (
        status.HTTP_400_BAD_REQUEST,
        LinkedInErrorMessages.ACCOUNT_NOT_CONNECTED,
    ),
    LinkedInErrorCodes.TOKEN_EXPIRED: (
        status.HTTP_401_UNAUTHORIZED,
        LinkedInErrorMessages.TOKEN_EXPIRED,
    ),
    LinkedInErrorCodes.TOKEN_REVOKED: (
        status.HTTP_401_UNAUTHORIZED,
        LinkedInErrorMessages.TOKEN_REVOKED,
    ),
    LinkedInErrorCodes.EMPTY_CAPTION: (
        status.HTTP_400_BAD_REQUEST,
        LinkedInErrorMessages.EMPTY_CAPTION,
    ),
    LinkedInErrorCodes.IMAGE_UPLOAD_FAILED: (
        status.HTTP_502_BAD_GATEWAY,
        LinkedInErrorMessages.IMAGE_UPLOAD_FAILED,
    ),
    LinkedInErrorCodes.PUBLISH_FAILED: (
        status.HTTP_502_BAD_GATEWAY,
        LinkedInErrorMessages.PUBLISH_FAILED,
    ),
    LinkedInErrorCodes.LINKEDIN_NOT_CONFIGURED: (
        status.HTTP_503_SERVICE_UNAVAILABLE,
        LinkedInErrorMessages.LINKEDIN_NOT_CONFIGURED,
    ),
    LinkedInErrorCodes.ORG_MEMBERSHIP_REQUIRED: (
        status.HTTP_403_FORBIDDEN,
        LinkedInErrorMessages.ORG_MEMBERSHIP_REQUIRED,
    ),
}


from app.core.constants.instagram_constants import InstagramErrorCodes, InstagramErrorMessages

_INSTAGRAM_PUBLISH_ERROR_MAP = {
    InstagramErrorCodes.ACCOUNT_NOT_CONNECTED: (
        status.HTTP_400_BAD_REQUEST,
        InstagramErrorMessages.ACCOUNT_NOT_CONNECTED,
    ),
    InstagramErrorCodes.TOKEN_EXPIRED: (
        status.HTTP_401_UNAUTHORIZED,
        InstagramErrorMessages.TOKEN_EXPIRED,
    ),
    InstagramErrorCodes.TOKEN_REVOKED: (
        status.HTTP_401_UNAUTHORIZED,
        InstagramErrorMessages.TOKEN_REVOKED,
    ),
    InstagramErrorCodes.EMPTY_CAPTION: (
        status.HTTP_400_BAD_REQUEST,
        InstagramErrorMessages.EMPTY_CAPTION,
    ),
    InstagramErrorCodes.IMAGE_REQUIRED: (
        status.HTTP_400_BAD_REQUEST,
        InstagramErrorMessages.IMAGE_REQUIRED,
    ),
    InstagramErrorCodes.PUBLISH_FAILED: (
        status.HTTP_502_BAD_GATEWAY,
        InstagramErrorMessages.PUBLISH_FAILED,
    ),
}


def _raise_draft_error(code: str) -> None:
    if code in _DRAFT_ERROR_MAP:
        status_code, detail = _DRAFT_ERROR_MAP[code]
        raise HTTPException(status_code=status_code, detail=detail)
    if code in _LINKEDIN_PUBLISH_ERROR_MAP:
        status_code, detail = _LINKEDIN_PUBLISH_ERROR_MAP[code]
        raise HTTPException(status_code=status_code, detail=detail)
    if code in _INSTAGRAM_PUBLISH_ERROR_MAP:
        status_code, detail = _INSTAGRAM_PUBLISH_ERROR_MAP[code]
        raise HTTPException(status_code=status_code, detail=detail)
    logger.error("Unexpected draft error: %s", code)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred.",
    )


@router.get(
    "",
    response_model=DraftListResponse,
    summary="List drafts",
)
def list_drafts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    workspaceId: str | None = None,
):
    try:
        return draft_service.list_drafts(db, current_user, workspace_id=workspaceId)
    except ValueError as exc:
        _raise_draft_error(str(exc))


@router.post(
    "",
    response_model=DraftResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a draft",
)
def create_draft(
    body: CreateDraftRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return draft_service.create_draft(db, current_user, body.model_dump())
    except ValueError as exc:
        _raise_draft_error(str(exc))


@router.get(
    "/{draft_id}",
    response_model=DraftResponse,
    summary="Get a draft",
)
def get_draft(
    draft_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return draft_service.get_draft(db, current_user, draft_id)
    except ValueError as exc:
        _raise_draft_error(str(exc))


@router.patch(
    "/{draft_id}",
    response_model=DraftResponse,
    summary="Update a draft",
)
def update_draft(
    draft_id: str,
    body: UpdateDraftRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return draft_service.update_draft(
            db, current_user, draft_id, body.model_dump(exclude_unset=True)
        )
    except ValueError as exc:
        _raise_draft_error(str(exc))


@router.post(
    "/{draft_id}/publish",
    response_model=PublishDraftResponse,
    summary="Publish an approved draft to target social platform",
)
def publish_draft(
    draft_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    organizationId: str | None = None,
):
    try:
        return publish_service.publish_draft(
            db,
            current_user,
            draft_id,
            organization_id=organizationId,
        )
    except ValueError as exc:
        _raise_draft_error(str(exc))
    except Exception as exc:
        logger.error("Unexpected publish error for draft %s: %s", draft_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        ) from exc


@router.post(
    "/{draft_id}/feedback",
    response_model=DraftResponse,
    summary="Submit client feedback and regenerate draft content via AI",
)
def submit_feedback(
    draft_id: str,
    body: SubmitFeedbackRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return draft_service.submit_feedback_and_regenerate(
            db, current_user, draft_id, body.feedback
        )
    except ValueError as exc:
        _raise_draft_error(str(exc))
    except Exception as exc:
        logger.error("Unexpected feedback regeneration error for draft %s: %s", draft_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI regeneration failed. Please try again.",
        ) from exc
