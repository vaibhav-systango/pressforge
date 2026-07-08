from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.onboarding import OnboardingRequest
from app.services.onboarding_service import onboarding_service
from app.repositories.organization_repository import organization_repository
from app.core.constants.onboarding_constants import OnboardingErrorCodes, OnboardingErrorMessages

router = APIRouter()

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete User Onboarding",
    description="Onboards the authenticated user by setting their account type (individual/organization) and storing onboarding details.",
)
async def onboard_user(
    request_data: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        updated_user = onboarding_service.onboard_user(db, current_user, request_data)
        organization_id = organization_repository.get_organization_id_for_user(db, updated_user.id)
        return {
            "id": updated_user.id,
            "fullName": updated_user.fullName,
            "email": updated_user.email,
            "accountType": updated_user.accountType,
            "onboardingStatus": updated_user.onboardingStatus,
            "isActive": updated_user.isActive,
            "lastLogin": updated_user.lastLogin,
            "createdAt": updated_user.createdAt,
            "updatedAt": updated_user.updatedAt,
            "organizationId": organization_id,
        }
    except Exception as e:
        code = str(e)
        if code == OnboardingErrorCodes.USER_ALREADY_ONBOARDED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=OnboardingErrorMessages.USER_ALREADY_ONBOARDED
            )
        elif code == OnboardingErrorCodes.INVALID_ONBOARDING_DETAILS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=OnboardingErrorMessages.INVALID_ONBOARDING_DETAILS
            )
        elif code == OnboardingErrorCodes.USER_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=OnboardingErrorMessages.USER_NOT_FOUND
            )
        # Log unexpected error and return 500
        print(f"Error occurred in onboarding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during onboarding."
        )
