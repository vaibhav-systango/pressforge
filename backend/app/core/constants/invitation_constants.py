from app.models.organization_member import OrganizationRole
from app.core.config import settings

INVITATION_PERMISSION_MATRIX = {
    OrganizationRole.OWNER: [OrganizationRole.ADMIN, OrganizationRole.MEMBER, OrganizationRole.CLIENT],
    OrganizationRole.ADMIN: [OrganizationRole.MEMBER, OrganizationRole.CLIENT],
    OrganizationRole.MEMBER: [OrganizationRole.CLIENT],
}

INVITATION_EXPIRY_DAYS = settings.INVITE_TOKEN_EXPIRE_DAYS


def organization_role_to_account_type(organization_role: str) -> str:
    """Map an organization member role to the users.accountType RBAC role name."""
    return f"ORG_{organization_role}"


class InvitationErrorCodes:
    ORGANIZATION_NOT_FOUND = "ORGANIZATION_NOT_FOUND"
    INVITATION_NOT_FOUND = "INVITATION_NOT_FOUND"
    INVITATION_EXPIRED = "INVITATION_EXPIRED"
    INVITATION_ALREADY_ACCEPTED = "INVITATION_ALREADY_ACCEPTED"
    PENDING_INVITATION_EXISTS = "PENDING_INVITATION_EXISTS"
    INSUFFICIENT_ROLE = "INSUFFICIENT_ROLE"
    INVITER_NOT_MEMBER = "INVITER_NOT_MEMBER"
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS"
    EMAIL_SEND_FAILED = "EMAIL_SEND_FAILED"

class InvitationErrorMessages:
    ORGANIZATION_NOT_FOUND = "Organization not found."
    INVITATION_NOT_FOUND = "Invitation not found."
    INVITATION_EXPIRED = "This invitation has expired."
    INVITATION_ALREADY_ACCEPTED = "This invitation has already been accepted."
    PENDING_INVITATION_EXISTS = "A pending invitation already exists for this email in the organization."
    INSUFFICIENT_ROLE = "You do not have permission to invite users with this role."
    INVITER_NOT_MEMBER = "You are not a member of this organization."
    USER_ALREADY_EXISTS = "This user already exists in the system."
    EMAIL_SEND_FAILED = "Failed to send invitation email. Please try again."
