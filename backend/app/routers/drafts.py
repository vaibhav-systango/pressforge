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
    DraftResponse,
    DraftListResponse,
)
from app.services.draft_service import draft_service

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
}


def _raise_draft_error(code: str) -> None:
    if code in _DRAFT_ERROR_MAP:
        status_code, detail = _DRAFT_ERROR_MAP[code]
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
