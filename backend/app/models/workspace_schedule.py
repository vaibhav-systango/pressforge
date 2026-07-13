from sqlalchemy import Column, String, Boolean, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class WorkspaceSchedule(Base):
    __tablename__ = "workspace_schedules"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    workspaceId = Column(
        String(26),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    platform = Column(String, nullable=True)
    dayOfWeek = Column(String, nullable=True)
    time = Column(String, nullable=True)
    contentType = Column(String, nullable=True)
    label = Column(String, nullable=True)
    datetime = Column(String, nullable=True)
    recurrence = Column(String, nullable=False, default="none")
    publishAsDraft = Column(Boolean, nullable=False, default=False)
    enabled = Column(Boolean, nullable=False, default=True)
    nextRun = Column(String, nullable=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(
        BigInteger,
        nullable=False,
        default=generate_timestamp_ms,
        onupdate=generate_timestamp_ms,
    )

    workspace = relationship("Workspace", back_populates="schedules")
