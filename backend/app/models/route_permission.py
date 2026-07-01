from sqlalchemy import Column, String, BigInteger, ForeignKey, UniqueConstraint
from app.database.database import Base
from app.models.user import generate_ulid, generate_timestamp_ms


class RoutePermission(Base):
    __tablename__ = "route_permissions"

    id = Column(String(26), primary_key=True, default=generate_ulid, index=True)
    method = Column(String(10), nullable=False, index=True)
    path = Column(String, nullable=False, index=True)
    permissionId = Column(String(26), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt = Column(BigInteger, nullable=False, default=generate_timestamp_ms)

    __table_args__ = (
        UniqueConstraint("method", "path", "permissionId", name="uq_route_permission"),
    )
