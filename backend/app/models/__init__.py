# Register all models here for SQLAlchemy metadata discovery
from app.database.database import Base
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_kyc import OrganizationKyc
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.route_permission import RoutePermission
from app.models.user_profile import UserProfile

__all__ = [
    "Base",
    "User",
    "Organization",
    "OrganizationKyc",
    "OrganizationMember",
    "Role",
    "Permission",
    "RolePermission",
    "RoutePermission"
    "UserProfile"
]
