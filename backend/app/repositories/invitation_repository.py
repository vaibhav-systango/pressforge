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


invitation_repository = InvitationRepository()
