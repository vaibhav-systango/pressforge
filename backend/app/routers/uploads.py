import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.constants.upload_constants import (
    KYC_ALLOWED_CONTENT_TYPES,
    KYC_MAX_FILE_SIZE_BYTES,
    UploadErrorCodes,
    UploadErrorMessages,
)
from app.models.user import generate_ulid
from app.providers.cloudinary_provider import cloudinary_provider
from app.schemas.uploads import KycDocumentUploadResponse

logger = logging.getLogger(__name__)
router = APIRouter()


async def _read_upload_with_size_limit(file: UploadFile, max_size: int) -> bytes:
    chunks: list[bytes] = []
    total_size = 0
    chunk_size = 64 * 1024

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > max_size:
            raise _upload_http_exception(UploadErrorCodes.FILE_TOO_LARGE)
        chunks.append(chunk)

    if total_size == 0:
        raise _upload_http_exception(UploadErrorCodes.EMPTY_FILE)

    return b"".join(chunks)


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
    summary="Upload a KYC business document to Cloudinary",
    description="Uploads the file to Cloudinary and returns document metadata. "
    "Persist this response in organization_kyc by including it as organizationDetails.document "
    "when calling POST /onboarding.",
)
async def upload_kyc_document(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise _upload_http_exception(UploadErrorCodes.EMPTY_FILE)

    content_type = (file.content_type or "").lower()
    if content_type not in KYC_ALLOWED_CONTENT_TYPES:
        raise _upload_http_exception(UploadErrorCodes.INVALID_FILE_TYPE)

    file_bytes = await _read_upload_with_size_limit(file, KYC_MAX_FILE_SIZE_BYTES)

    try:
        result = cloudinary_provider.upload_kyc_document(
            file_bytes=file_bytes,
            upload_key=generate_ulid(),
            filename=file.filename,
            content_type=content_type,
        )
        return result
    except ValueError as exc:
        raise _upload_http_exception(str(exc)) from exc
