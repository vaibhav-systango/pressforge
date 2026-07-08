from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.organization_kyc import OrganizationKyc

class OrganizationRepository:

    def create_organization(
        self,
        db: Session,
        *,
        name: str,
        ownerUserId: str,
        website: str | None = None,
        teamSize: str | None = None,
        industries: str | None = "[]",
        primaryGoal: str,
        objective: str | None = None,
        description: str | None = None
    ) -> Organization:
        """Create and persist a new organization record."""
        organization = Organization(
            name=name,
            ownerUserId=ownerUserId,
            website=website,
            teamSize=teamSize,
            industries=industries,
            primaryGoal=primaryGoal,
            objective=objective,
            description=description
        )
        db.add(organization)
        db.flush()
        return organization

    def create_member(
        self,
        db: Session,
        *,
        organizationId: str,
        userId: str,
        role: str,
        invitedBy: str | None = None
    ) -> OrganizationMember:
        """Link a user to an organization with a specific role."""
        member = OrganizationMember(
            organizationId=organizationId,
            userId=userId,
            role=role,
            invitedBy=invitedBy
        )
        db.add(member)
        db.flush()
        return member

    def get_organization_id_for_user(self, db: Session, user_id: str) -> str | None:
        """Fetch the earliest organization ID linked to a user, if any."""
        membership = (
            db.query(OrganizationMember)
            .filter(OrganizationMember.userId == user_id)
            .order_by(OrganizationMember.joinedAt.asc())
            .first()
        )
        return membership.organizationId if membership else None

    def get_role_for_user(self, db: Session, user_id: str, organization_id: str | None = None) -> str | None:
        query = db.query(OrganizationMember).filter(OrganizationMember.userId == user_id)
        if organization_id:
            query = query.filter(OrganizationMember.organizationId == organization_id)
        membership = query.order_by(OrganizationMember.joinedAt.asc()).first()
        return membership.role if membership else None

    def create_kyc(
        self,
        db: Session,
        *,
        organizationId: str,
        legalName: str,
        businessEntityType: str,
        taxIdentificationNumber: str,
        registeredAddress: str,
        primaryContactName: str,
        primaryContactDesignation: str | None = None,
        businessDocumentFileKey: str | None = None
    ) -> OrganizationKyc:
        """Create and persist a new KYC compliance record for an organization."""
        kyc = OrganizationKyc(
            organizationId=organizationId,
            legalName=legalName,
            businessEntityType=businessEntityType,
            taxIdentificationNumber=taxIdentificationNumber,
            registeredAddress=registeredAddress,
            primaryContactName=primaryContactName,
            primaryContactDesignation=primaryContactDesignation,
            businessDocumentFileKey=businessDocumentFileKey
        )
        db.add(kyc)
        db.flush()
        return kyc

# Export a single repository instance
organization_repository = OrganizationRepository()
