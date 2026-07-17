import enum
from sqlalchemy import Column, String, Text, BigInteger, ForeignKey, UniqueConstraint
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class SocialPlatform(str, enum.Enum):
    INSTAGRAM = "INSTAGRAM"
    LINKEDIN = "LINKEDIN"


class SocialAccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"
    ERROR = "ERROR"


class SocialAccount(Base):
    __tablename__ = "social_accounts"
    __table_args__ = (
        UniqueConstraint("userId", "organizationId", "platform", name="uq_social_account_user_org_platform"),
    )

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    userId = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organizationId = Column(String(26), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    platform = Column(String, nullable=False, default=SocialPlatform.INSTAGRAM.value, index=True)
    externalAccountId = Column(String, nullable=False, index=True)
    username = Column(String, nullable=True)
    displayName = Column(String, nullable=True)
    profilePictureUrl = Column(Text, nullable=True)
    facebookPageId = Column(String, nullable=True)
    accessToken = Column(Text, nullable=False)
    tokenExpiresAt = Column(BigInteger, nullable=True)
    scopes = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=SocialAccountStatus.ACTIVE.value, index=True)
    connectedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms, onupdate=generate_timestamp_ms)
