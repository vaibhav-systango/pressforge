from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database.database import get_db
from app.models.user import User
from app.schemas.invitation import InviteUserRequest, InviteUserResponse, AcceptInvitationRequest
from app.schemas.auth import Token
from app.core.dependencies import get_current_user, permission_guard
from app.core.constants.invitation_constants import InvitationErrorCodes, InvitationErrorMessages
from app.services.invitation_service import invitation_service

logger = logging.getLogger(__name__)
router = APIRouter()


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
        access_token, refresh_token, user = invitation_service.accept_invitation(
            db,
            token=body.token,
            password=body.password,
        )
        return {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": user,
        }
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
