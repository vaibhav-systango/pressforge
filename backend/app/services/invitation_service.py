import logging
import time
from sqlalchemy.exc import IntegrityError
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
from app.models.user import User, OnboardingStatus
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

        normalized_email = email.lower().strip()
        existing = invitation_repository.get_pending_by_email_and_org(db, normalized_email, organization_id)
        if existing:
            raise ValueError(InvitationErrorCodes.PENDING_INVITATION_EXISTS)

        if user_repository.get_by_email(db, normalized_email):
            raise ValueError(InvitationErrorCodes.USER_ALREADY_EXISTS)

        expires_at = int((time.time() + INVITATION_EXPIRY_DAYS * 86400) * 1000)

        try:
            invitation = invitation_repository.create(
                db,
                email=normalized_email,
                fullName=full_name,
                organizationId=organization_id,
                role=role,
                invitedBy=inviter.id,
                expiresAt=expires_at
            )
        except IntegrityError as exc:
            db.rollback()
            raise ValueError(InvitationErrorCodes.PENDING_INVITATION_EXISTS) from exc

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
    ) -> tuple[str, str, User, str]:
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

        organization_id = invitation.organizationId

        user.onboardingStatus = OnboardingStatus.COMPLETED.value
        db.add(user)
        db.flush()

        invitation_repository.delete(db, invitation)
        db.commit()
        db.refresh(user)

        user = user_repository.update_last_login(db, user)
        payload = {"sub": user.id, "email": user.email, "role": user.accountType}
        access_token = create_access_token(data=payload)
        refresh_token = create_refresh_token(data=payload)

        return access_token, refresh_token, user, organization_id

    def get_clients(
        self,
        db: Session,
        *,
        current_user: User,
        organization_id: str,
        search: str | None = None,
        plan: str | None = None,
        status_filter: str | None = None,
        role_filter: str | None = None
    ) -> list[dict]:
        """
        Get members/clients for an organization scoped by the requester's role.

        Hierarchy rules:
        - OWNER / ADMIN  → see every member & invitation in the organization
        - MEMBER          → see only users they personally invited
        - CLIENT          → see nothing (empty list)
        """
        # 1. Resolve the requester's role inside this organization
        requester_member = db.query(OrganizationMember).filter(
            OrganizationMember.organizationId == organization_id,
            OrganizationMember.userId == current_user.id
        ).first()

        if not requester_member:
            return []

        requester_role = OrganizationRole(requester_member.role)

        # CLIENT role cannot see anyone
        if requester_role == OrganizationRole.CLIENT:
            return []

        # 2. Determine scope filter
        # OWNER / ADMIN → see everyone; MEMBER → only their invitees
        invited_by_filter: str | None = None
        if requester_role == OrganizationRole.MEMBER:
            invited_by_filter = current_user.id

        # Plan filtering optimization
        if plan and plan.lower() not in ("all", "free"):
            return []

        clients = []

        # Decide which queries to run based on status_filter
        query_active = not status_filter or status_filter.lower() in ("all", "active")
        query_invites = not status_filter or status_filter.lower() in ("all", "pending", "expired")

        role_val = None if not role_filter or role_filter.lower() == "all" else role_filter.upper()

        # 3. Fetch Active Members (User + OrganizationMember)
        if query_active:
            members = organization_repository.get_members_by_role_with_users(
                db,
                organization_id=organization_id,
                role=role_val,
                search=search,
                invited_by=invited_by_filter
            )
            for member, user in members:
                # Skip the requester themselves from the list
                if user.id == current_user.id:
                    continue
                clients.append({
                    "id": user.id,
                    "name": user.fullName,
                    "email": user.email,
                    "status": "active",
                    "role": member.role,
                    "expiresAt": None,
                    "isAccepted": True,
                    "workspaceId": None,
                    "plan": "Free"
                })

        # 4. Fetch Pending/Expired Invitations
        if query_invites:
            invitations = invitation_repository.get_by_org_and_role(
                db,
                organization_id=organization_id,
                role=role_val,
                search=search,
                invited_by=invited_by_filter
            )
            now_ms = int(time.time() * 1000)
            for invitation in invitations:
                is_expired = invitation.status == InvitationStatus.EXPIRED.value or invitation.expiresAt < now_ms
                status_val = "expired" if is_expired else "pending"

                # Check status filter at service layer (since status is computed)
                if status_filter and status_filter.lower() != "all" and status_filter.lower() != status_val:
                    continue

                clients.append({
                    "id": invitation.id,
                    "name": invitation.fullName,
                    "email": invitation.email,
                    "status": status_val,
                    "role": invitation.role,
                    "expiresAt": invitation.expiresAt,
                    "isAccepted": False,
                    "workspaceId": None,
                    "plan": "Free"
                })

        return clients

    def delete_pending_invitation(
        self,
        db: Session,
        *,
        organization_id: str,
        invitation_id: str
    ) -> None:
        """Delete a pending or expired invitation from an organization."""
        invitation = invitation_repository.get_by_id(db, invitation_id)
        if not invitation or invitation.organizationId != organization_id:
            raise ValueError(InvitationErrorCodes.INVITATION_NOT_FOUND)

        if invitation.status == InvitationStatus.ACCEPTED:
            raise ValueError(InvitationErrorCodes.INVITATION_ALREADY_ACCEPTED)

        invitation_repository.delete(db, invitation)
        db.commit()

    def get_mock_inbox(self, db: Session, *, organization_id: str) -> list[dict]:
        """Retrieve simulated emails for all pending organization invitations."""
        org = organization_repository.get_by_id(db, organization_id)
        if not org:
            raise ValueError(InvitationErrorCodes.ORGANIZATION_NOT_FOUND)

        invitations = invitation_repository.get_pending_by_org(db, organization_id)

        emails = []
        for invitation in invitations:
            token = create_invite_token(invitation.id)
            invite_link = f"/auth/accept-invite?token={token}"
            
            body_text = (
                f"Hi {invitation.fullName},\n\n"
                f"You have been invited to review content briefs and approvals for {org.name} on PressForge.\n\n"
                f"Your login email will be: {invitation.email}\n\n"
                f"Click the link to accept the invitation and set your password:\n"
                f"http://localhost:3000{invite_link}"
            )
            
            emails.append({
                "id": f"email-{invitation.id}",
                "from": "noreply@pressforge.ai",
                "to": invitation.email,
                "subject": f"Invite: Join PressForge portal for {org.name}",
                "preview": f"Invitation to join {org.name} on PressForge",
                "time": "Just now",
                "read": False,
                "body": body_text,
                "timestamp": invitation.createdAt,
                "inviteLink": invite_link
            })

        return emails

    def get_invitable_roles(
        self,
        db: Session,
        *,
        user: User,
        organization_id: str
    ) -> list[dict]:
        inviter_member = db.query(OrganizationMember).filter(
            OrganizationMember.organizationId == organization_id,
            OrganizationMember.userId == user.id
        ).first()
        if not inviter_member:
            raise ValueError(InvitationErrorCodes.INVITER_NOT_MEMBER)

        inviter_role = OrganizationRole(inviter_member.role)
        allowed_roles = INVITATION_PERMISSION_MATRIX.get(inviter_role, [])
        return [
            {"value": role.value, "label": role.value.capitalize()}
            for role in allowed_roles
        ]


invitation_service = InvitationService()

