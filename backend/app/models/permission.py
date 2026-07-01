from sqlalchemy import Column, String, Text, BigInteger
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms, onupdate=generate_timestamp_ms)
