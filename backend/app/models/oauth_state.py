from sqlalchemy import Column, String, BigInteger, ForeignKey
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    state = Column(String(128), nullable=False, unique=True, index=True)
    userId = Column(String(26), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organizationId = Column(String(26), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    expiresAt = Column(BigInteger, nullable=False)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
