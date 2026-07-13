from sqlalchemy import Column, String, Boolean, BigInteger, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    organizationId = Column(
        String(26),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    ownerUserId = Column(
        String(26),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    guestSessionId = Column(String(64), nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    website = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    industry = Column(String, nullable=True)
    targetAudience = Column(Text, nullable=True)
    brandVoice = Column(Text, nullable=True)
    logoUrl = Column(String, nullable=True)
    tone = Column(String, nullable=True)
    keywords = Column(JSON, nullable=False, default=list)
    rules = Column(JSON, nullable=False, default=list)
    isActive = Column(Boolean, nullable=False, default=True, index=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(
        BigInteger,
        nullable=False,
        default=generate_timestamp_ms,
        onupdate=generate_timestamp_ms,
    )

    schedules = relationship(
        "WorkspaceSchedule",
        back_populates="workspace",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
