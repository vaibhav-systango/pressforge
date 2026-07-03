import enum
from sqlalchemy import Column, String, BigInteger, ForeignKey
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class InvitationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    EXPIRED = "EXPIRED"


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    email = Column(String, nullable=False, index=True)
    fullName = Column(String, nullable=False)
    organizationId = Column(String(26), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)
    invitedBy = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default=InvitationStatus.PENDING, index=True)
    expiresAt = Column(BigInteger, nullable=False)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
