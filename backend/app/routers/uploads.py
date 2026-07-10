import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.constants.upload_constants import (
    KYC_ALLOWED_CONTENT_TYPES,
    KYC_MAX_FILE_SIZE_BYTES,
    UploadErrorCodes,
    UploadErrorMessages,
)
from app.core.dependencies import get_current_user
from app.models.user import User
from app.providers.cloudinary_provider import cloudinary_provider
from app.schemas.uploads import KycDocumentUploadResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def _upload_http_exception(code: str) -> HTTPException:
    status_code = status.HTTP_400_BAD_REQUEST
    if code == UploadErrorCodes.CLOUDINARY_NOT_CONFIGURED:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    message = getattr(UploadErrorMessages, code, UploadErrorMessages.UPLOAD_FAILED)
    return HTTPException(status_code=status_code, detail=message)


@router.post(
    "/kyc",
    response_model=KycDocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a KYC identity or business document to Cloudinary",
)
async def upload_kyc_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file or not file.filename:
        raise _upload_http_exception(UploadErrorCodes.EMPTY_FILE)

    content_type = (file.content_type or "").lower()
    if content_type not in KYC_ALLOWED_CONTENT_TYPES:
        raise _upload_http_exception(UploadErrorCodes.INVALID_FILE_TYPE)

    file_bytes = await file.read()
    if not file_bytes:
        raise _upload_http_exception(UploadErrorCodes.EMPTY_FILE)

    if len(file_bytes) > KYC_MAX_FILE_SIZE_BYTES:
        raise _upload_http_exception(UploadErrorCodes.FILE_TOO_LARGE)

    try:
        result = cloudinary_provider.upload_kyc_document(
            file_bytes=file_bytes,
            user_id=current_user.id,
            filename=file.filename,
            content_type=content_type,
        )
        return result
    except ValueError as exc:
        raise _upload_http_exception(str(exc)) from exc
