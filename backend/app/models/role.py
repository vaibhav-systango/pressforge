from sqlalchemy import Column, String, Text, Boolean, BigInteger, ForeignKey, UniqueConstraint
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


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)
    updatedAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms, onupdate=generate_timestamp_ms)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    roleId = Column(String(26), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permissionId = Column(String(26), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)

    __table_args__ = (
        UniqueConstraint("roleId", "permissionId", name="uq_role_permission"),
    )
