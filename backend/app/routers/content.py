from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.constants.content_constants import ContentErrorCodes, ContentErrorMessages
from app.schemas.content import GenerateContentRequest, GenerateContentResponse
from app.services.content_generation_service import content_generation_service

logger = logging.getLogger(__name__)
router = APIRouter()

_CONTENT_ERROR_MAP = {
    ContentErrorCodes.GEMINI_NOT_CONFIGURED: (
        status.HTTP_503_SERVICE_UNAVAILABLE,
        ContentErrorMessages.GEMINI_NOT_CONFIGURED,
    ),
    ContentErrorCodes.GENERATION_FAILED: (
        status.HTTP_502_BAD_GATEWAY,
        ContentErrorMessages.GENERATION_FAILED,
    ),
    ContentErrorCodes.WORKSPACE_NOT_FOUND: (
        status.HTTP_404_NOT_FOUND,
        ContentErrorMessages.WORKSPACE_NOT_FOUND,
    ),
    ContentErrorCodes.ACCESS_DENIED: (
        status.HTTP_403_FORBIDDEN,
        ContentErrorMessages.ACCESS_DENIED,
    ),
    ContentErrorCodes.INVALID_PROMPT: (
        status.HTTP_400_BAD_REQUEST,
        ContentErrorMessages.INVALID_PROMPT,
    ),
}


def _raise_content_error(code: str) -> None:
    if code in _CONTENT_ERROR_MAP:
        status_code, detail = _CONTENT_ERROR_MAP[code]
        raise HTTPException(status_code=status_code, detail=detail)
    logger.error("Unexpected content error: %s", code)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred.",
    )


@router.post(
    "/generate",
    response_model=GenerateContentResponse,
    summary="Generate AI content variations for the content editor",
)
def generate_content(
    body: GenerateContentRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return content_generation_service.generate(db, current_user, body.model_dump())
    except ValueError as exc:
        _raise_content_error(str(exc))
