from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, TokenRefreshRequest, ProfileUpdateRequest, PasswordUpdateRequest, OrganizationUpdateRequest
from app.core.dependencies import get_current_user, permission_guard
from app.services.auth_service import auth_service
from app.repositories.organization_repository import organization_repository
from app.core.constants.auth_constants import AuthErrorCodes, AuthErrorMessages

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_user_response(db: Session, user: User) -> dict:
    organization_id = organization_repository.get_organization_id_for_user(db, user.id)
    organization_role = (
        organization_repository.get_role_for_user(db, user.id, organization_id)
        if organization_id
        else None
    )
    org = organization_repository.get_by_id(db, organization_id) if organization_id else None
    return {
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
        "organizationRole": organization_role,
        "organizationName": org.name if org else None,
    }


def _build_auth_response(db: Session, access_token: str, refresh_token: str, user: User) -> dict:
    user_payload = _build_user_response(db, user)
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": user_payload,
        "organizationId": user_payload["organizationId"],
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
    return _build_user_response(db, current_user)

@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update Active User Profile",
    description="Update profile details (like fullName) of the currently logged-in user.",
)
async def update_me(
    profile_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.repositories.user_repository import user_repository
    updated_user = user_repository.update_profile(db, current_user, fullName=profile_data.fullName)
    return _build_user_response(db, updated_user)

@router.put(
    "/change-password",
    summary="Change User Password",
    description="Updates the password for the current authenticated user.",
)
async def change_password(
    password_data: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.repositories.user_repository import user_repository
    from app.core.security import verify_password, get_password_hash
    
    if not current_user.passwordHash or not verify_password(password_data.currentPassword, current_user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
    
    hashed_password = get_password_hash(password_data.newPassword)
    user_repository.update_password(db, current_user, passwordHash=hashed_password)
    return {"message": "Password changed successfully."}

@router.put(
    "/organization",
    summary="Update Organization Details",
    description="Updates the organization name of the current authenticated owner.",
)
async def update_organization(
    org_data: OrganizationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    organization_id = organization_repository.get_organization_id_for_user(db, current_user.id)
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found for current user."
        )
        
    org = organization_repository.get_by_id(db, organization_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )
        
    # Check if the user is the owner/admin
    role = organization_repository.get_role_for_user(db, current_user.id, organization_id)
    if role != "OWNER" and role != "ADMIN":
         raise HTTPException(
             status_code=status.HTTP_403_FORBIDDEN,
             detail="Only owners and admins can update organization details."
         )
         
    organization_repository.update_organization(db, org, name=org_data.name)
    return {"id": org.id, "name": org.name}

@router.delete(
    "/me",
    summary="Delete User Account",
    description="Permanently deletes (soft-deletes) the authenticated user's account.",
)
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.repositories.user_repository import user_repository
    user_repository.delete_user(db, current_user)
    return {"message": "Account deleted successfully."}

