class UploadErrorCodes:
    CLOUDINARY_NOT_CONFIGURED = "CLOUDINARY_NOT_CONFIGURED"
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    UPLOAD_FAILED = "UPLOAD_FAILED"
    EMPTY_FILE = "EMPTY_FILE"


class UploadErrorMessages:
    CLOUDINARY_NOT_CONFIGURED = "Document upload is not configured. Contact your administrator."
    INVALID_FILE_TYPE = "Unsupported file type. Allowed formats: PDF, PNG, JPG."
    FILE_TOO_LARGE = "File is too large. Maximum size is 10MB."
    UPLOAD_FAILED = "Failed to upload document. Please try again."
    EMPTY_FILE = "No file was provided."


KYC_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
KYC_ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}
KYC_CLOUDINARY_FOLDER = "pressforge/kyc"

BRAND_ASSET_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
BRAND_ASSET_ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}
