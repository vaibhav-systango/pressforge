import enum
from sqlalchemy import Column, String, BigInteger, Enum, ForeignKey
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms

class OrganizationRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    CLIENT = "CLIENT"

class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    organizationId = Column(String(26), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    userId = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(
        String,
        nullable=False,
        default=OrganizationRole.MEMBER,
        index=True
    )
    invitedBy = Column(String(26), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    workspaceId = Column(
        String(26),
        ForeignKey("workspaces.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    joinedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
