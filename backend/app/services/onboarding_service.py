import json
from sqlalchemy.orm import Session
from app.models.user import User, AccountType, OnboardingStatus
from app.models.organization_member import OrganizationRole
from app.schemas.onboarding import OnboardingRequest
from app.repositories.user_repository import user_repository
from app.repositories.organization_repository import organization_repository
from app.core.constants.onboarding_constants import OnboardingErrorCodes

class OnboardingService:

    def onboard_user(self, db: Session, user: User, request_data: OnboardingRequest) -> User:
        """
        Onboard a user to an individual or organization account type.
        Ensures transaction atomic safety.
        """
        # 1. Verify user onboarding is not already completed
        if user.onboardingStatus == OnboardingStatus.COMPLETED.value:
            raise ValueError(OnboardingErrorCodes.USER_ALREADY_ONBOARDED)

        try:
            if request_data.accountType == AccountType.INDIVIDUAL:
                details = request_data.individualDetails
                if not details:
                    raise ValueError(OnboardingErrorCodes.INVALID_ONBOARDING_DETAILS)

                # Create user profile
                user_repository.create_user_profile(
                    db,
                    userId=user.id,
                    primaryGoal=details.primaryGoal,
                    contentThemes=details.contentThemes,
                    website=details.website
                )

                # Update user onboarding status
                user_repository.update_onboarding_status(
                    db,
                    user=user,
                    onboarding_status=OnboardingStatus.COMPLETED.value,
                    account_type=AccountType.INDIVIDUAL.value
                )

            elif request_data.accountType == AccountType.ORGANIZATION:
                details = request_data.organizationDetails
                if not details:
                    raise ValueError(OnboardingErrorCodes.INVALID_ONBOARDING_DETAILS)

                # Serialize industries to JSON string
                industries_json = json.dumps(details.industries)

                # Create organization
                org = organization_repository.create_organization(
                    db,
                    name=details.name,
                    ownerUserId=user.id,
                    website=details.website,
                    teamSize=details.teamSize,
                    industries=industries_json,
                    primaryGoal=details.primaryGoal,
                    objective=details.objective,
                    description=details.description
                )

                # Create organization owner member
                organization_repository.create_member(
                    db,
                    organizationId=org.id,
                    userId=user.id,
                    role=OrganizationRole.OWNER.value
                )

                # Create KYC compliance record
                organization_repository.create_kyc(
                    db,
                    organizationId=org.id,
                    legalName=details.legalName,
                    businessEntityType=details.businessEntityType,
                    taxIdentificationNumber=details.taxIdentificationNumber,
                    registeredAddress=details.registeredAddress,
                    primaryContactName=details.primaryContactName,
                    primaryContactDesignation=details.primaryContactDesignation,
                    businessDocumentFileKey=details.businessDocumentFileKey
                )

                # Update user onboarding status
                user_repository.update_onboarding_status(
                    db,
                    user=user,
                    onboarding_status=OnboardingStatus.COMPLETED.value,
                    account_type=AccountType.ORGANIZATION.value
                )

            else:
                raise ValueError(OnboardingErrorCodes.INVALID_ONBOARDING_DETAILS)

            db.commit()
            db.refresh(user)
            return user

        except Exception as e:
            db.rollback()
            raise e

# Export a single service instance
onboarding_service = OnboardingService()
