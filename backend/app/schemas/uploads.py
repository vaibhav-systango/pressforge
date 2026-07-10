from pydantic import BaseModel


class KycDocumentUploadResponse(BaseModel):
    publicId: str
    secureUrl: str
    resourceType: str
    format: str | None = None
    bytes: int | None = None
    originalFilename: str | None = None
