# Register all models here for SQLAlchemy metadata discovery
from app.database.database import Base
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_kyc import OrganizationKyc
from app.models.organization_member import OrganizationMember
from app.models.user_profile import UserProfile

__all__ = [
    "Base",
    "User",
    "Organization",
    "OrganizationKyc",
    "OrganizationMember",
    "UserProfile"
]
