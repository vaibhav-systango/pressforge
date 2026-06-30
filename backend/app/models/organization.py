from sqlalchemy import Column, String, Boolean, BigInteger, ForeignKey, Text
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    name = Column(String, nullable=False, index=True)
    ownerUserId = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    website = Column(String, nullable=True)
    teamSize = Column(String, nullable=True)
    industries = Column(String, nullable=True, default="[]")
    primaryGoal = Column(String, nullable=False)
    objective = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    isActive = Column(Boolean, nullable=False, default=True, index=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms, onupdate=generate_timestamp_ms)
