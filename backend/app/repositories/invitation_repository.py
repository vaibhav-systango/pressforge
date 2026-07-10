from sqlalchemy.orm import Session
from app.models.invitation import Invitation, InvitationStatus


class InvitationRepository:

    def create(
        self,
        db: Session,
        *,
        email: str,
        fullName: str,
        organizationId: str,
        role: str,
        invitedBy: str,
        expiresAt: int
    ) -> Invitation:
        invitation = Invitation(
            email=email.lower().strip(),
            fullName=fullName,
            organizationId=organizationId,
            role=role,
            invitedBy=invitedBy,
            expiresAt=expiresAt
        )
        db.add(invitation)
        db.flush()
        return invitation

    def get_by_id(self, db: Session, invitation_id: str) -> Invitation | None:
        return db.query(Invitation).filter(Invitation.id == invitation_id).first()

    def get_pending_by_email_and_org(self, db: Session, email: str, organizationId: str) -> Invitation | None:
        return db.query(Invitation).filter(
            Invitation.email == email.lower().strip(),
            Invitation.organizationId == organizationId,
            Invitation.status == InvitationStatus.PENDING
        ).first()

    def mark_accepted(self, db: Session, invitation: Invitation) -> Invitation:
        invitation.status = InvitationStatus.ACCEPTED
        db.add(invitation)
        db.flush()
        return invitation

    def mark_expired(self, db: Session, invitation: Invitation) -> Invitation:
        invitation.status = InvitationStatus.EXPIRED
        db.add(invitation)
        db.flush()
        return invitation

    def delete(self, db: Session, invitation: Invitation) -> None:
        db.delete(invitation)
        db.flush()

    def get_by_org_and_role(
        self,
        db: Session,
        organization_id: str,
        role: str | None = None,
        search: str | None = None,
        invited_by: str | None = None
    ) -> list[Invitation]:
        """Fetch invitations for an organization with optional role, search, and invitedBy filters."""
        query = db.query(Invitation).filter(
            Invitation.organizationId == organization_id
        )
        if role:
            query = query.filter(Invitation.role == role)
        if invited_by:
            query = query.filter(Invitation.invitedBy == invited_by)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                Invitation.fullName.ilike(search_term) | Invitation.email.ilike(search_term)
            )
        return query.all()

    def get_pending_by_org(self, db: Session, organization_id: str) -> list[Invitation]:
        """Fetch all pending invitations for an organization."""
        return db.query(Invitation).filter(
            Invitation.organizationId == organization_id,
            Invitation.status == InvitationStatus.PENDING
        ).all()


invitation_repository = InvitationRepository()

