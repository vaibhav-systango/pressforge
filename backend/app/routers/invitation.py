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
    organization_role = (
        organization_repository.get_role_for_user(db, user.id, organization_id)
        if organization_id
        else None
    )
    org = organization_repository.get_by_id(db, organization_id) if organization_id else None
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
            "organizationRole": organization_role,
            "organizationName": org.name if org else None,
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
    skip: int = 0,
    limit: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(permission_guard)
):
    try:
        return invitation_service.get_clients(
            db,
            current_user=current_user,
            organization_id=org_id,
            search=search,
            plan=plan,
            status_filter=status_filter,
            role_filter=role_filter,
            skip=skip,
            limit=limit
        )
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.ORGANIZATION_NOT_FOUND: (status.HTTP_404_NOT_FOUND, InvitationErrorMessages.ORGANIZATION_NOT_FOUND),
            InvitationErrorCodes.INVITER_NOT_MEMBER: (status.HTTP_403_FORBIDDEN, InvitationErrorMessages.INVITER_NOT_MEMBER),
        }
        if code in error_map:
            status_code, detail = error_map[code]
            raise HTTPException(status_code=status_code, detail=detail)
        logger.error(f"Unexpected error in get_clients: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


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
            current_user=current_user,
            organization_id=org_id,
            invitation_id=invitation_id
        )
        return
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.INVITER_NOT_MEMBER: (status.HTTP_403_FORBIDDEN, InvitationErrorMessages.INVITER_NOT_MEMBER),
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
        return invitation_service.get_mock_inbox(db, current_user=current_user, organization_id=org_id)
    except ValueError as e:
        code = str(e)
        error_map = {
            InvitationErrorCodes.INVITER_NOT_MEMBER: (status.HTTP_403_FORBIDDEN, InvitationErrorMessages.INVITER_NOT_MEMBER),
            InvitationErrorCodes.ORGANIZATION_NOT_FOUND: (status.HTTP_404_NOT_FOUND, InvitationErrorMessages.ORGANIZATION_NOT_FOUND),
        }
        if code in error_map:
            status_code, detail = error_map[code]
            raise HTTPException(status_code=status_code, detail=detail)
        logger.error(f"Unexpected error in get_mock_inbox: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.")


from pydantic import BaseModel

class AssignWorkspaceRequest(BaseModel):
    workspaceId: str | None = None
    workspaceIds: list[str] | None = None
    action: str | None = None  # "add", "remove", or "set"

@router.patch(
    "/organizations/{org_id}/members/{member_user_id}/workspace",
    status_code=status.HTTP_200_OK,
    summary="Assign a workspace to an organization member",
)
async def assign_workspace(
    org_id: str,
    member_user_id: str,
    body: AssignWorkspaceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(permission_guard)
):
    try:
        from app.models.workspace import Workspace
        from app.models.organization_member import OrganizationMember, MemberWorkspace

        # 1. Verify that current_user is OWNER, ADMIN, or MEMBER of the organization
        manager_member = db.query(OrganizationMember).filter(
            OrganizationMember.organizationId == org_id,
            OrganizationMember.userId == current_user.id
        ).first()
        if not manager_member or manager_member.role not in ["OWNER", "ADMIN", "MEMBER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organization owners and admins can assign workspaces to members"
            )

        # 2. Find the member to be updated and verify their user record is active
        member = db.query(OrganizationMember).join(
            User, OrganizationMember.userId == User.id
        ).filter(
            OrganizationMember.organizationId == org_id,
            OrganizationMember.userId == member_user_id,
            User.isActive == True
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active member not found in organization"
            )

        # Check: organization members can only assign workspaces to clients
        if manager_member.role == "MEMBER" and member.role != "CLIENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only organization owners and admins can assign workspaces to members"
            )

        # 3. If workspaceId is provided, verify it exists, belongs to the organization, and is active
        if body.workspaceId:
            workspace = db.query(Workspace).filter(
                Workspace.id == body.workspaceId,
                Workspace.organizationId == org_id,
                Workspace.isActive == True
            ).first()
            if not workspace:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workspace not found in organization"
                )

        # 4. Update the member's workspace mappings in member_workspaces
        action = body.action or "add"

        if body.workspaceIds is not None:
            # Validate all workspaceIds in list belong to the organization and are active
            if body.workspaceIds:
                valid_count = db.query(Workspace).filter(
                    Workspace.id.in_(body.workspaceIds),
                    Workspace.organizationId == org_id,
                    Workspace.isActive == True
                ).count()
                if valid_count != len(body.workspaceIds):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="One or more workspaces not found in organization"
                    )
            # Clear old mappings
            db.query(MemberWorkspace).filter(MemberWorkspace.memberId == member.id).delete()
            # Insert new mappings
            for ws_id in body.workspaceIds:
                db.add(MemberWorkspace(memberId=member.id, workspaceId=ws_id))
            
            # For backward compatibility, update the legacy single column
            member.workspaceId = body.workspaceIds[0] if body.workspaceIds else None

        elif body.workspaceId is not None:
            if not body.workspaceId:
                # If workspaceId is empty string or None, we clear all
                db.query(MemberWorkspace).filter(MemberWorkspace.memberId == member.id).delete()
                member.workspaceId = None
            elif action == "remove":
                # Remove this specific mapping
                db.query(MemberWorkspace).filter(
                    MemberWorkspace.memberId == member.id,
                    MemberWorkspace.workspaceId == body.workspaceId
                ).delete()
                # Update legacy column
                remaining = db.query(MemberWorkspace).filter(MemberWorkspace.memberId == member.id).all()
                member.workspaceId = remaining[0].workspaceId if remaining else None
            else:  # "add"
                # Add relationship if it doesn't already exist
                existing = db.query(MemberWorkspace).filter(
                    MemberWorkspace.memberId == member.id,
                    MemberWorkspace.workspaceId == body.workspaceId
                ).first()
                if not existing:
                    db.add(MemberWorkspace(memberId=member.id, workspaceId=body.workspaceId))
                # Update legacy column
                member.workspaceId = body.workspaceId

        db.commit()

        # Query all active workspaceIds for response
        ws_ids = [wm.workspaceId for wm in db.query(MemberWorkspace).filter(MemberWorkspace.memberId == member.id).all()]

        return {
            "status": "success",
            "memberId": member.id,
            "workspaceId": member.workspaceId,
            "workspaceIds": ws_ids
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in assign_workspace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred."
        )



