import enum
from sqlalchemy import Column, String, Text, BigInteger, ForeignKey
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms

class BusinessEntityType(str, enum.Enum):
    LLC = "LLC"
    CORPORATION = "CORPORATION"
    SOLE_PROPRIETORSHIP = "SOLE_PROPRIETORSHIP"
    PARTNERSHIP = "PARTNERSHIP"
    OTHER = "OTHER"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class OrganizationKyc(Base):
    __tablename__ = "organization_kyc"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    organizationId = Column(String(26), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    legalName = Column(String, nullable=False, index=True)
    businessEntityType = Column(String, nullable=False, index=True)
    taxIdentificationNumber = Column(String, nullable=False, index=True)
    registeredAddress = Column(Text, nullable=False)
    primaryContactName = Column(String, nullable=False)
    primaryContactDesignation = Column(String, nullable=True)

    # Cloudinary document metadata
    documentPublicId = Column(String, nullable=True)
    documentSecureUrl = Column(Text, nullable=True)
    documentResourceType = Column(String, nullable=True)
    documentFormat = Column(String, nullable=True)
    documentBytes = Column(BigInteger, nullable=True)
    documentOriginalFilename = Column(String, nullable=True)

    verificationStatus = Column(
        String,
        nullable=False,
        default=VerificationStatus.PENDING,
        index=True
    )
    verifiedAt = Column(BigInteger, nullable=True)
    rejectionReason = Column(Text, nullable=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms, onupdate=generate_timestamp_ms)
