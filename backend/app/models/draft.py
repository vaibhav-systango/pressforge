from sqlalchemy import Column, String, BigInteger, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    workspaceId = Column(
        String(26),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    prompt = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="draft", index=True)
    platform = Column(String, nullable=True)
    version = Column(Integer, nullable=False, default=1)
    scheduledAt = Column(String, nullable=True)

    caption = Column(Text, nullable=True)
    hashtags = Column(JSON, nullable=False, default=list)
    imageBrief = Column(Text, nullable=True)
    imageUrl = Column(String, nullable=True)
    liCaption = Column(Text, nullable=True)
    liHashtags = Column(JSON, nullable=False, default=list)
    liImageBrief = Column(Text, nullable=True)

    goal = Column(String, nullable=True)
    cta = Column(String, nullable=True)
    visualStyle = Column(String, nullable=True)
    referenceUrls = Column(JSON, nullable=False, default=list)
    referenceText = Column(Text, nullable=True)
    history = Column(JSON, nullable=False, default=list)

    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(
        BigInteger,
        nullable=False,
        default=generate_timestamp_ms,
        onupdate=generate_timestamp_ms,
    )

    workspace = relationship("Workspace", lazy="selectin")
