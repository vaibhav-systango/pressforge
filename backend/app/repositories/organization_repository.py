from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.organization_kyc import OrganizationKyc
from app.models.user import User


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
        documentPublicId: str | None = None,
        documentSecureUrl: str | None = None,
        documentResourceType: str | None = None,
        documentFormat: str | None = None,
        documentBytes: int | None = None,
        documentOriginalFilename: str | None = None,
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
            documentPublicId=documentPublicId,
            documentSecureUrl=documentSecureUrl,
            documentResourceType=documentResourceType,
            documentFormat=documentFormat,
            documentBytes=documentBytes,
            documentOriginalFilename=documentOriginalFilename,
        )
        db.add(kyc)
        db.flush()
        return kyc

    def get_by_id(self, db: Session, organization_id: str) -> Organization | None:
        """Fetch a single organization by its unique ID."""
        return db.query(Organization).filter(Organization.id == organization_id).first()

    def get_members_by_role_with_users(
        self,
        db: Session,
        organization_id: str,
        role: str | None = None,
        search: str | None = None,
        invited_by: str | None = None
    ) -> list[tuple[OrganizationMember, User]]:
        """Fetch members of an organization with optional role, search, and invitedBy filters."""
        query = (
            db.query(OrganizationMember, User)
            .join(User, OrganizationMember.userId == User.id)
            .filter(
                OrganizationMember.organizationId == organization_id
            )
        )
        if role:
            query = query.filter(OrganizationMember.role == role)
        if invited_by:
            query = query.filter(OrganizationMember.invitedBy == invited_by)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                User.fullName.ilike(search_term) | User.email.ilike(search_term)
            )
        return query.all()

# Export a single repository instance
organization_repository = OrganizationRepository()

