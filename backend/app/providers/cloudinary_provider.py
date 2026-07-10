import logging
import time

import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

from app.core.config import settings
from app.core.constants.upload_constants import UploadErrorCodes

logger = logging.getLogger(__name__)


class CloudinaryProvider:
    def _ensure_configured(self) -> None:
        if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY or not settings.CLOUDINARY_API_SECRET:
            raise ValueError(UploadErrorCodes.CLOUDINARY_NOT_CONFIGURED)

    def _configure(self) -> None:
        self._ensure_configured()
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )

    def upload_kyc_document(
        self,
        *,
        file_bytes: bytes,
        user_id: str,
        filename: str,
        content_type: str,
    ) -> dict:
        self._configure()

        resource_type = "raw" if content_type == "application/pdf" else "image"
        public_id = f"{user_id}/{int(time.time() * 1000)}"

        try:
            result = cloudinary.uploader.upload(
                file_bytes,
                folder=settings.CLOUDINARY_KYC_FOLDER,
                public_id=public_id,
                resource_type=resource_type,
                use_filename=True,
                unique_filename=True,
                overwrite=False,
            )
        except Exception as exc:
            logger.error("Cloudinary upload failed for user %s: %s", user_id, exc)
            raise ValueError(UploadErrorCodes.UPLOAD_FAILED) from exc

        secure_url = result.get("secure_url")
        public_id_result = result.get("public_id")
        if not secure_url or not public_id_result:
            raise ValueError(UploadErrorCodes.UPLOAD_FAILED)

        return {
            "publicId": public_id_result,
            "secureUrl": secure_url,
            "resourceType": result.get("resource_type", resource_type),
            "format": result.get("format"),
            "bytes": result.get("bytes"),
            "originalFilename": filename,
        }

    def get_secure_url(self, public_id: str, *, resource_type: str = "image") -> str:
        self._configure()
        url, _ = cloudinary_url(public_id, resource_type=resource_type, secure=True)
        return url


cloudinary_provider = CloudinaryProvider()
