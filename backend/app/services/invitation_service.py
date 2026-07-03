import logging
import time
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    create_invite_token,
    decode_invite_token,
    create_access_token,
    create_refresh_token,
)
from app.core.config import settings
from app.core.constants.invitation_constants import (
    InvitationErrorCodes,
    INVITATION_PERMISSION_MATRIX,
    INVITATION_EXPIRY_DAYS,
    organization_role_to_account_type,
)
from app.core.constants.email_templates import invitation_email
from app.models.organization_member import OrganizationMember, OrganizationRole
from app.models.organization import Organization
from app.models.invitation import Invitation, InvitationStatus
from app.models.user import User
from app.repositories.invitation_repository import invitation_repository
from app.repositories.user_repository import user_repository
from app.repositories.organization_repository import organization_repository
from app.providers.email_provider import email_provider

logger = logging.getLogger(__name__)


class InvitationService:

    def send_invitation(
        self,
        db: Session,
        *,
        inviter: User,
        organization_id: str,
        email: str,
        full_name: str,
        role: str
    ) -> Invitation:
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            raise ValueError(InvitationErrorCodes.ORGANIZATION_NOT_FOUND)

        inviter_member = db.query(OrganizationMember).filter(
            OrganizationMember.organizationId == organization_id,
            OrganizationMember.userId == inviter.id
        ).first()
        if not inviter_member:
            raise ValueError(InvitationErrorCodes.INVITER_NOT_MEMBER)

        inviter_role = OrganizationRole(inviter_member.role)
        target_role = OrganizationRole(role)
        if target_role not in INVITATION_PERMISSION_MATRIX.get(inviter_role, []):
            raise ValueError(InvitationErrorCodes.INSUFFICIENT_ROLE)

        existing = invitation_repository.get_pending_by_email_and_org(db, email, organization_id)
        if existing:
            raise ValueError(InvitationErrorCodes.PENDING_INVITATION_EXISTS)

        if user_repository.get_by_email(db, email):
            raise ValueError(InvitationErrorCodes.USER_ALREADY_EXISTS)

        expires_at = int((time.time() + INVITATION_EXPIRY_DAYS * 86400) * 1000)

        invitation = invitation_repository.create(
            db,
            email=email,
            fullName=full_name,
            organizationId=organization_id,
            role=role,
            invitedBy=inviter.id,
            expiresAt=expires_at
        )

        accept_link = f"{settings.FRONTEND_URL}/auth/accept-invite?token={create_invite_token(invitation.id)}"
        template = invitation_email(
            org_name=org.name,
            full_name=full_name,
            email=email,
            accept_link=accept_link
        )
        try:
            email_provider.send(to=email, subject=template["subject"], html=template["html"])
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            db.rollback()
            raise ValueError(InvitationErrorCodes.EMAIL_SEND_FAILED) from e

        db.commit()
        db.refresh(invitation)
        return invitation

    def accept_invitation(
        self,
        db: Session,
        *,
        token: str,
        password: str
    ) -> tuple[str, str, User]:
        invitation_id = decode_invite_token(token)
        if not invitation_id:
            raise ValueError(InvitationErrorCodes.INVITATION_NOT_FOUND)

        invitation = invitation_repository.get_by_id(db, invitation_id)
        if not invitation:
            raise ValueError(InvitationErrorCodes.INVITATION_NOT_FOUND)

        if invitation.status == InvitationStatus.ACCEPTED:
            raise ValueError(InvitationErrorCodes.INVITATION_ALREADY_ACCEPTED)

        now_ms = int(time.time() * 1000)
        if invitation.expiresAt < now_ms:
            invitation_repository.mark_expired(db, invitation)
            db.commit()
            raise ValueError(InvitationErrorCodes.INVITATION_EXPIRED)

        if invitation.status == InvitationStatus.EXPIRED:
            raise ValueError(InvitationErrorCodes.INVITATION_EXPIRED)

        existing_user = user_repository.get_by_email(db, invitation.email)
        if existing_user:
            raise ValueError(InvitationErrorCodes.USER_ALREADY_EXISTS)

        password_hash = get_password_hash(password)
        user = user_repository.create(
            db,
            fullName=invitation.fullName,
            email=invitation.email,
            passwordHash=password_hash,
            accountType=organization_role_to_account_type(invitation.role),
        )

        organization_repository.create_member(
            db,
            organizationId=invitation.organizationId,
            userId=user.id,
            role=invitation.role,
            invitedBy=invitation.invitedBy
        )

        invitation_repository.delete(db, invitation)
        db.commit()
        db.refresh(user)

        user = user_repository.update_last_login(db, user)
        payload = {"sub": user.id, "email": user.email, "role": user.accountType}
        access_token = create_access_token(data=payload)
        refresh_token = create_refresh_token(data=payload)

        return access_token, refresh_token, user


invitation_service = InvitationService()
