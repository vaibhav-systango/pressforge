from sqlalchemy import Column, String, BigInteger, ForeignKey, UniqueConstraint
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    roleId = Column(String(26), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permissionId = Column(String(26), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)

    __table_args__ = (
        UniqueConstraint("roleId", "permissionId", name="uq_role_permission"),
    )
