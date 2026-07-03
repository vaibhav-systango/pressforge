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
