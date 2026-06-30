from sqlalchemy import Column, String, BigInteger, ForeignKey, JSON
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    userId = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    primaryGoal = Column(String, nullable=False)
    contentThemes = Column(JSON, nullable=False, default=list)
    website = Column(String, nullable=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
