from sqlalchemy import Column, String, Text, Boolean, BigInteger
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    isActive = Column(Boolean, nullable=False, default=True, index=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms, onupdate=generate_timestamp_ms)
