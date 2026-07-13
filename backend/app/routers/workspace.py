from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user, get_optional_current_user
from app.core.constants.workspace_constants import WorkspaceErrorCodes, WorkspaceErrorMessages
from app.schemas.workspace import (
    WorkspaceResponse,
    WorkspaceListResponse,
    CreateWorkspaceRequest,
    UpdateWorkspaceRequest,
    SetActiveWorkspaceRequest,
    ClaimGuestWorkspacesRequest,
    CreateScheduleRequest,
    UpdateScheduleRequest,
    ScheduleResponse,
)
from app.services.workspace_service import workspace_service

logger = logging.getLogger(__name__)
router = APIRouter()

_WORKSPACE_ERROR_MAP = {
    WorkspaceErrorCodes.WORKSPACE_NOT_FOUND: (
        status.HTTP_404_NOT_FOUND,
        WorkspaceErrorMessages.WORKSPACE_NOT_FOUND,
    ),
    WorkspaceErrorCodes.ACCESS_DENIED: (
        status.HTTP_403_FORBIDDEN,
        WorkspaceErrorMessages.ACCESS_DENIED,
    ),
    WorkspaceErrorCodes.ACTIVE_WORKSPACE_NOT_FOUND: (
        status.HTTP_404_NOT_FOUND,
        WorkspaceErrorMessages.ACTIVE_WORKSPACE_NOT_FOUND,
    ),
    WorkspaceErrorCodes.SCHEDULE_NOT_FOUND: (
        status.HTTP_404_NOT_FOUND,
        WorkspaceErrorMessages.SCHEDULE_NOT_FOUND,
    ),
    WorkspaceErrorCodes.INVALID_WORKSPACE_NAME: (
        status.HTTP_400_BAD_REQUEST,
        WorkspaceErrorMessages.INVALID_WORKSPACE_NAME,
    ),
    WorkspaceErrorCodes.GUEST_SESSION_REQUIRED: (
        status.HTTP_400_BAD_REQUEST,
        WorkspaceErrorMessages.GUEST_SESSION_REQUIRED,
    ),
    WorkspaceErrorCodes.WORKSPACE_NAME_CONFLICT: (
        status.HTTP_409_CONFLICT,
        WorkspaceErrorMessages.WORKSPACE_NAME_CONFLICT,
    ),
    WorkspaceErrorCodes.CLIENT_NOT_FOUND: (
        status.HTTP_404_NOT_FOUND,
        WorkspaceErrorMessages.CLIENT_NOT_FOUND,
    ),
}


def _raise_workspace_error(code: str) -> None:
    if code in _WORKSPACE_ERROR_MAP:
        status_code, detail = _WORKSPACE_ERROR_MAP[code]
        raise HTTPException(status_code=status_code, detail=detail)
    logger.error(f"Unexpected workspace error: {code}")
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred.",
    )


@router.get(
    "",
    response_model=WorkspaceListResponse,
    summary="List workspaces for the current user or guest session",
    description=(
        "Organization owners, admins, and members receive all workspaces in their organization by default. "
        "Pass `clientId` to filter workspaces assigned to a specific client user."
    ),
)
async def list_workspaces(
    clientId: str | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
    x_guest_session_id: Annotated[str | None, Header()] = None,
):
    try:
        if current_user:
            return workspace_service.list_workspaces(
                db, current_user, client_id=clientId
            )
        if not x_guest_session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required or provide X-Guest-Session-Id header.",
            )
        return workspace_service.list_guest_workspaces(db, x_guest_session_id)
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workspace",
    description=(
        "Create a workspace without authentication by supplying an X-Guest-Session-Id header. "
        "Authenticated users may omit the header and the workspace is linked to their account."
    ),
    openapi_extra={"security": []},
)
async def create_workspace(
    body: CreateWorkspaceRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
    x_guest_session_id: Annotated[str | None, Header()] = None,
):
    try:
        if current_user:
            return workspace_service.create_workspace(db, current_user, body.model_dump())
        if not x_guest_session_id:
            raise ValueError(WorkspaceErrorCodes.GUEST_SESSION_REQUIRED)
        return workspace_service.create_guest_workspace(
            db, x_guest_session_id, body.model_dump()
        )
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.post(
    "/claim-guest",
    response_model=WorkspaceListResponse,
    summary="Claim guest workspaces after login or signup",
)
async def claim_guest_workspaces(
    body: ClaimGuestWorkspacesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return workspace_service.claim_guest_workspaces(
            db, current_user, body.guestSessionId
        )
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.patch(
    "/active",
    summary="Set the active workspace for the current user",
)
async def set_active_workspace(
    body: SetActiveWorkspaceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        active_id = workspace_service.set_active_workspace(
            db, current_user, body.workspaceId
        )
        return {"activeWorkspaceId": active_id}
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.get(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    summary="Get a workspace by ID",
)
async def get_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return workspace_service.get_workspace(db, current_user, workspace_id)
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.patch(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    summary="Update a workspace",
)
async def update_workspace(
    workspace_id: str,
    body: UpdateWorkspaceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return workspace_service.update_workspace(
            db,
            current_user,
            workspace_id,
            body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workspace",
)
async def delete_workspace(
    workspace_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workspace_service.delete_workspace(db, current_user, workspace_id)
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.post(
    "/{workspace_id}/schedules",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a schedule to a workspace",
)
async def create_schedule(
    workspace_id: str,
    body: CreateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return workspace_service.create_schedule(
            db, current_user, workspace_id, body.model_dump()
        )
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.patch(
    "/{workspace_id}/schedules/{schedule_id}",
    response_model=ScheduleResponse,
    summary="Update a workspace schedule",
)
async def update_schedule(
    workspace_id: str,
    schedule_id: str,
    body: UpdateScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return workspace_service.update_schedule(
            db,
            current_user,
            workspace_id,
            schedule_id,
            body.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        _raise_workspace_error(str(e))


@router.delete(
    "/{workspace_id}/schedules/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workspace schedule",
)
async def delete_schedule(
    workspace_id: str,
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        workspace_service.delete_schedule(db, current_user, workspace_id, schedule_id)
    except ValueError as e:
        _raise_workspace_error(str(e))
