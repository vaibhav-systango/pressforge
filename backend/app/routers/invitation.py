from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging
from typing import List

from app.database.database import get_db
from app.models.user import User
from app.schemas.invitation import InviteUserRequest, InviteUserResponse, AcceptInvitationRequest, ClientResponse, InvitableRoleResponse
from app.schemas.auth import Token
from app.core.dependencies import get_current_user, permission_guard
from app.core.constants.invitation_constants import InvitationErrorCodes, InvitationErrorMessages
from app.repositories.organization_repository import organization_repository
from app.services.invitation_service import invitation_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_token_response(db: Session, access_token: str, refresh_token: str, user: User) -> dict:
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
    "/organizations/{org_id}/invite",
    response_model=InviteUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a user to an organization",
)
async def invite_user(
    org_id: str,
    body: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(permission_guard)
):
    try:
        invitation = invitation_service.send_invitation(
            db,
            inviter=current_user,
            organization_id=org_id,
            email=body.email,
            full_name=body.fullName,
            role=body.role
        )
        return invitation
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.ORGANIZATION_NOT_FOUND: (status.HTTP_404_NOT_FOUND, InvitationErrorMessages.ORGANIZATION_NOT_FOUND),
            InvitationErrorCodes.INVITER_NOT_MEMBER: (status.HTTP_403_FORBIDDEN, InvitationErrorMessages.INVITER_NOT_MEMBER),
            InvitationErrorCodes.INSUFFICIENT_ROLE: (status.HTTP_403_FORBIDDEN, InvitationErrorMessages.INSUFFICIENT_ROLE),
            InvitationErrorCodes.PENDING_INVITATION_EXISTS: (status.HTTP_409_CONFLICT, InvitationErrorMessages.PENDING_INVITATION_EXISTS),
            InvitationErrorCodes.USER_ALREADY_EXISTS: (status.HTTP_409_CONFLICT, InvitationErrorMessages.USER_ALREADY_EXISTS),
            InvitationErrorCodes.EMAIL_SEND_FAILED: (status.HTTP_502_BAD_GATEWAY, InvitationErrorMessages.EMAIL_SEND_FAILED),
        }
        if code in error_map:
            status_code, detail = error_map[code]
            raise HTTPException(status_code=status_code, detail=detail)
        logger.error(f"Unexpected error in invite_user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


@router.post(
    "/invitations/accept",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Accept invitation and set permanent password",
)
async def accept_invitation(
    body: AcceptInvitationRequest,
    db: Session = Depends(get_db)
):
    try:
        access_token, refresh_token, user, _organization_id = invitation_service.accept_invitation(
            db,
            token=body.token,
            password=body.password,
        )
        return _build_token_response(db, access_token, refresh_token, user)
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.INVITATION_NOT_FOUND: (status.HTTP_404_NOT_FOUND, InvitationErrorMessages.INVITATION_NOT_FOUND),
            InvitationErrorCodes.INVITATION_EXPIRED: (status.HTTP_410_GONE, InvitationErrorMessages.INVITATION_EXPIRED),
            InvitationErrorCodes.INVITATION_ALREADY_ACCEPTED: (status.HTTP_409_CONFLICT, InvitationErrorMessages.INVITATION_ALREADY_ACCEPTED),
            InvitationErrorCodes.USER_ALREADY_EXISTS: (status.HTTP_409_CONFLICT, InvitationErrorMessages.USER_ALREADY_EXISTS),
        }
        if code in error_map:
            status_code, detail = error_map[code]
            raise HTTPException(status_code=status_code, detail=detail)
        logger.error(f"Unexpected error in accept_invitation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


@router.get(
    "/plans",
    status_code=status.HTTP_200_OK,
    summary="Get list of supported subscription plans",
)
async def get_plans():
    return ["Free", "Basic", "Pro", "Enterprise"]


@router.get(
    "/organizations/{org_id}/invitable-roles",
    response_model=List[InvitableRoleResponse],
    status_code=status.HTTP_200_OK,
    summary="Get roles that the current user can invite within the organization",
)
async def get_invitable_roles(
    org_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(permission_guard)
):
    try:
        return invitation_service.get_invitable_roles(db, user=current_user, organization_id=org_id)
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.INVITER_NOT_MEMBER: (status.HTTP_403_FORBIDDEN, InvitationErrorMessages.INVITER_NOT_MEMBER),
        }
        if code in error_map:
            status_code, detail = error_map[code]
            raise HTTPException(status_code=status_code, detail=detail)
        logger.error(f"Unexpected error in get_invitable_roles: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


@router.get(
    "/organizations/{org_id}/clients",
    response_model=List[ClientResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all clients/members for an organization",
)
async def get_clients(
    org_id: str,
    search: str | None = None,
    plan: str | None = None,
    status_filter: str | None = None,
    role_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(permission_guard)
):
    return invitation_service.get_clients(
        db,
        current_user=current_user,
        organization_id=org_id,
        search=search,
        plan=plan,
        status_filter=status_filter,
        role_filter=role_filter
    )


@router.delete(
    "/organizations/{org_id}/invitations/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a pending invitation",
)
async def delete_invitation(
    org_id: str,
    invitation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(permission_guard)
):
    try:
        invitation_service.delete_pending_invitation(
            db,
            organization_id=org_id,
            invitation_id=invitation_id
        )
        return
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.INVITATION_NOT_FOUND: (status.HTTP_404_NOT_FOUND, InvitationErrorMessages.INVITATION_NOT_FOUND),
            InvitationErrorCodes.INVITATION_ALREADY_ACCEPTED: (status.HTTP_400_BAD_REQUEST, InvitationErrorMessages.INVITATION_ALREADY_ACCEPTED),
        }
        if code in error_map:
            status_code, detail = error_map[code]
            raise HTTPException(status_code=status_code, detail=detail)
        logger.error(f"Unexpected error in delete_invitation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


@router.get(
    "/organizations/{org_id}/mock-inbox",
    status_code=status.HTTP_200_OK,
    summary="Get simulated inbox for organization invitations",
)
async def get_mock_inbox(
    org_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(permission_guard)
):
    try:
        return invitation_service.get_mock_inbox(db, organization_id=org_id)
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.ORGANIZATION_NOT_FOUND: (status.HTTP_404_NOT_FOUND, InvitationErrorMessages.ORGANIZATION_NOT_FOUND),
        }
        if code in error_map:
            status_code, detail = error_map[code]
            raise HTTPException(status_code=status_code, detail=detail)
        logger.error(f"Unexpected error in get_mock_inbox: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


