from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, TokenRefreshRequest
from app.core.dependencies import get_current_user, permission_guard
from app.services.auth_service import auth_service
from app.repositories.organization_repository import organization_repository
from app.core.constants.auth_constants import AuthErrorCodes, AuthErrorMessages

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_auth_response(db: Session, access_token: str, refresh_token: str, user: User) -> dict:
    organization_id = organization_repository.get_organization_id_for_user(db, user.id)
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": user.id,
            "fullName": user.fullName,
            "email": user.email,
            "accountType": user.accountType,
            "onboardingStatus": user.onboardingStatus,
            "isActive": user.isActive,
            "lastLogin": user.lastLogin,
            "createdAt": user.createdAt,
            "updatedAt": user.updatedAt,
            "organizationId": organization_id,
        },
        "organizationId": organization_id,
    }


@router.post(
    "/signup",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Registers a new user in the system with their full name, email, and password. The initial account type is set to `UNASSIGNED` until the onboarding flow is completed.",
)
async def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        access_token, refresh_token, user = auth_service.register_user(db, user_in)
        return {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": user
        }
    except Exception as e:
        code = str(e)
        if code == AuthErrorCodes.EMAIL_ALREADY_EXISTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=AuthErrorMessages.EMAIL_ALREADY_EXISTS
            )
        logger.error(f"Unexpected error in signup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred."
        )

@router.post(
    "/login",
    response_model=Token,
    summary="User Authentication (Login)",
    description="Verify credentials (email and password) and return access & refresh tokens along with user information.",
)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    try:
        access_token, refresh_token, user = auth_service.authenticate_user(db, credentials)
        return _build_auth_response(db, access_token, refresh_token, user)
    except Exception as e:
        code = str(e)
        if code == AuthErrorCodes.INACTIVE_USER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=AuthErrorMessages.INACTIVE_USER
            )
        elif code == AuthErrorCodes.INVALID_CREDENTIALS:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=AuthErrorMessages.INVALID_CREDENTIALS
            )
        logger.error(f"Unexpected error in login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred."
        )

@router.post(
    "/refresh",
    response_model=Token,
    summary="Renew Authentication Tokens",
    description="Exchange a valid refresh token for a new set of access and refresh tokens.",
)
async def refresh_tokens(refresh_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    try:
        access_token, refresh_token, user = auth_service.refresh_auth_tokens(db, refresh_data.refreshToken)
        return _build_auth_response(db, access_token, refresh_token, user)
    except Exception as e:
        code = str(e)
        if code == AuthErrorCodes.INVALID_REFRESH_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=AuthErrorMessages.INVALID_REFRESH_TOKEN
            )
        elif code == AuthErrorCodes.INACTIVE_USER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=AuthErrorMessages.INACTIVE_USER
            )
        elif code == AuthErrorCodes.USER_NOT_FOUND:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=AuthErrorMessages.USER_NOT_FOUND
            )
        logger.error(f"Unexpected error in refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred."
        )

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve Active User Profile",
    description="Fetch details of the currently logged-in user using bearer token authentication.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    organization_id = organization_repository.get_organization_id_for_user(db, current_user.id)
    organization_role = (
        organization_repository.get_role_for_user(db, current_user.id, organization_id)
        if organization_id
        else None
    )
    return {
        "id": current_user.id,
        "fullName": current_user.fullName,
        "email": current_user.email,
        "accountType": current_user.accountType,
        "onboardingStatus": current_user.onboardingStatus,
        "isActive": current_user.isActive,
        "lastLogin": current_user.lastLogin,
        "createdAt": current_user.createdAt,
        "updatedAt": current_user.updatedAt,
        "organizationId": organization_id,
        "organizationRole": organization_role,
    }
