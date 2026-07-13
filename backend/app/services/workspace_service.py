import logging

from sqlalchemy.orm import Session

from app.core.constants.workspace_constants import WorkspaceErrorCodes
from app.models.organization_member import OrganizationMember, OrganizationRole
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.workspace import Workspace
from app.models.workspace_schedule import WorkspaceSchedule
from app.repositories.organization_repository import organization_repository
from app.repositories.workspace_repository import workspace_repository

logger = logging.getLogger(__name__)


def _normalize_workspace_name(name: str) -> str:
    return " ".join(name.lower().split())


def _schedule_to_dict(schedule: WorkspaceSchedule) -> dict:
    return {
        "id": schedule.id,
        "workspaceId": schedule.workspaceId,
        "platform": schedule.platform,
        "dayOfWeek": schedule.dayOfWeek,
        "time": schedule.time,
        "contentType": schedule.contentType,
        "label": schedule.label,
        "datetime": schedule.datetime,
        "recurrence": schedule.recurrence,
        "publishAsDraft": schedule.publishAsDraft,
        "enabled": schedule.enabled,
        "nextRun": schedule.nextRun,
    }


def _workspace_to_dict(workspace: Workspace) -> dict:
    return {
        "id": workspace.id,
        "name": workspace.name,
        "website": workspace.website,
        "description": workspace.description,
        "industry": workspace.industry,
        "targetAudience": workspace.targetAudience,
        "brandVoice": workspace.brandVoice,
        "logoUrl": workspace.logoUrl,
        "tone": workspace.tone,
        "keywords": workspace.keywords or [],
        "rules": workspace.rules or [],
        "ownerId": workspace.ownerUserId,
        "organizationId": workspace.organizationId,
        "schedules": [_schedule_to_dict(s) for s in (workspace.schedules or [])],
        "createdAt": workspace.createdAt,
        "updatedAt": workspace.updatedAt,
    }


class WorkspaceService:

    def _get_user_profile(self, db: Session, user_id: str) -> UserProfile | None:
        return db.query(UserProfile).filter(UserProfile.userId == user_id).first()

    def _get_or_create_user_profile(self, db: Session, user: User) -> UserProfile:
        profile = self._get_user_profile(db, user.id)
        if profile:
            return profile

        profile = UserProfile(
            userId=user.id,
            primaryGoal="general",
            contentThemes=[],
        )
        db.add(profile)
        db.flush()
        return profile

    def _assert_unique_workspace_name(
        self,
        db: Session,
        name: str,
        *,
        user: User | None = None,
        guest_session_id: str | None = None,
        exclude_workspace_id: str | None = None,
    ) -> None:
        normalized = _normalize_workspace_name(name)
        org_id = self._resolve_organization_id(db, user) if user else None

        if guest_session_id:
            existing = workspace_repository.list_by_guest_session(db, guest_session_id.strip())
        elif org_id:
            existing = workspace_repository.list_by_organization(db, org_id)
        elif user:
            existing = workspace_repository.list_by_owner(db, user.id)
        else:
            return

        for workspace in existing:
            if exclude_workspace_id and workspace.id == exclude_workspace_id:
                continue
            if _normalize_workspace_name(workspace.name) == normalized:
                raise ValueError(WorkspaceErrorCodes.WORKSPACE_NAME_CONFLICT)

    def _get_active_workspace_id(self, db: Session, user_id: str) -> str | None:
        profile = self._get_user_profile(db, user_id)
        return profile.activeWorkspaceId if profile else None

    def _is_org_member(self, db: Session, user_id: str, organization_id: str) -> bool:
        return (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organizationId == organization_id,
                OrganizationMember.userId == user_id,
            )
            .first()
            is not None
        )

    def _can_access_workspace(self, db: Session, user: User, workspace: Workspace) -> bool:
        if workspace.ownerUserId == user.id:
            return True
        if workspace.organizationId and self._is_org_member(db, user.id, workspace.organizationId):
            return True
        return False

    def _resolve_organization_id(self, db: Session, user: User) -> str | None:
        return organization_repository.get_organization_id_for_user(db, user.id)

    def _get_org_role(self, db: Session, user_id: str, organization_id: str) -> str | None:
        return organization_repository.get_role_for_user(db, user_id, organization_id)

    def _assert_org_client(
        self, db: Session, organization_id: str, client_user_id: str
    ) -> None:
        member = organization_repository.get_member(
            db,
            organization_id=organization_id,
            user_id=client_user_id,
        )
        if not member or member.role != OrganizationRole.CLIENT.value:
            raise ValueError(WorkspaceErrorCodes.CLIENT_NOT_FOUND)

    def list_workspaces(
        self, db: Session, user: User, *, client_id: str | None = None
    ) -> dict:
        org_id = self._resolve_organization_id(db, user)
        if org_id:
            role = self._get_org_role(db, user.id, org_id)
            if role in (
                OrganizationRole.OWNER.value,
                OrganizationRole.ADMIN.value,
                OrganizationRole.MEMBER.value,
            ):
                if client_id:
                    self._assert_org_client(db, org_id, client_id)
                    workspaces = workspace_repository.list_by_organization_and_client(
                        db, org_id, client_id
                    )
                else:
                    workspaces = workspace_repository.list_by_organization(db, org_id)
            elif role == OrganizationRole.CLIENT.value:
                workspaces = workspace_repository.list_by_organization_and_client(
                    db, org_id, user.id
                )
            else:
                workspaces = workspace_repository.list_by_owner(db, user.id)
        else:
            workspaces = workspace_repository.list_by_owner(db, user.id)

        active_workspace_id = self._get_active_workspace_id(db, user.id)
        accessible_ids = {workspace.id for workspace in workspaces}
        if active_workspace_id and active_workspace_id not in accessible_ids:
            active_workspace_id = workspaces[0].id if workspaces else None

        return {
            "workspaces": [_workspace_to_dict(workspace) for workspace in workspaces],
            "activeWorkspaceId": active_workspace_id,
        }

    def get_workspace(self, db: Session, user: User, workspace_id: str) -> dict:
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(WorkspaceErrorCodes.WORKSPACE_NOT_FOUND)
        if not self._can_access_workspace(db, user, workspace):
            raise ValueError(WorkspaceErrorCodes.ACCESS_DENIED)
        return _workspace_to_dict(workspace)

    def list_guest_workspaces(self, db: Session, guest_session_id: str) -> dict:
        workspaces = workspace_repository.list_by_guest_session(db, guest_session_id)
        active_workspace_id = workspaces[0].id if workspaces else None
        return {
            "workspaces": [_workspace_to_dict(workspace) for workspace in workspaces],
            "activeWorkspaceId": active_workspace_id,
        }

    def create_guest_workspace(self, db: Session, guest_session_id: str, data: dict) -> dict:
        name = (data.get("name") or "").strip()
        if not name:
            raise ValueError(WorkspaceErrorCodes.INVALID_WORKSPACE_NAME)

        if not guest_session_id.strip():
            raise ValueError(WorkspaceErrorCodes.GUEST_SESSION_REQUIRED)

        self._assert_unique_workspace_name(
            db, name, guest_session_id=guest_session_id.strip()
        )

        try:
            workspace = workspace_repository.create(
                db,
                name=name,
                ownerUserId=None,
                guestSessionId=guest_session_id.strip(),
                website=data.get("website"),
                description=data.get("description"),
                industry=data.get("industry"),
                targetAudience=data.get("targetAudience"),
                brandVoice=data.get("brandVoice"),
                logoUrl=data.get("logoUrl"),
                tone=data.get("tone"),
                keywords=data.get("keywords") or [],
                rules=data.get("rules") or [],
            )
            db.commit()
            refreshed = workspace_repository.get_by_id(db, workspace.id)
            return _workspace_to_dict(refreshed or workspace)
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to create guest workspace: {exc}")
            raise

    def claim_guest_workspaces(
        self, db: Session, user: User, guest_session_id: str
    ) -> dict:
        guest_session_id = guest_session_id.strip()
        if not guest_session_id:
            raise ValueError(WorkspaceErrorCodes.GUEST_SESSION_REQUIRED)

        workspaces = workspace_repository.list_by_guest_session(db, guest_session_id)
        if not workspaces:
            return self.list_workspaces(db, user)

        org_id = self._resolve_organization_id(db, user)

        try:
            for workspace in workspaces:
                workspace.ownerUserId = user.id
                workspace.guestSessionId = None
                if org_id:
                    workspace.organizationId = org_id
                db.add(workspace)

            profile = self._get_or_create_user_profile(db, user)
            if not profile.activeWorkspaceId:
                profile.activeWorkspaceId = workspaces[0].id
                db.add(profile)

            db.commit()
            return self.list_workspaces(db, user)
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to claim guest workspaces: {exc}")
            raise

    def create_workspace(self, db: Session, user: User, data: dict) -> dict:
        name = (data.get("name") or "").strip()
        if not name:
            raise ValueError(WorkspaceErrorCodes.INVALID_WORKSPACE_NAME)

        org_id = self._resolve_organization_id(db, user)

        self._assert_unique_workspace_name(db, name, user=user)

        try:
            workspace = workspace_repository.create(
                db,
                name=name,
                ownerUserId=user.id,
                organizationId=org_id,
                website=data.get("website"),
                description=data.get("description"),
                industry=data.get("industry"),
                targetAudience=data.get("targetAudience"),
                brandVoice=data.get("brandVoice"),
                logoUrl=data.get("logoUrl"),
                tone=data.get("tone"),
                keywords=data.get("keywords") or [],
                rules=data.get("rules") or [],
            )
            db.commit()
            db.refresh(workspace)

            profile = self._get_or_create_user_profile(db, user)
            if not profile.activeWorkspaceId:
                profile.activeWorkspaceId = workspace.id
                db.add(profile)
                db.commit()

            refreshed = workspace_repository.get_by_id(db, workspace.id)
            return _workspace_to_dict(refreshed or workspace)
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to create workspace: {exc}")
            raise

    def update_workspace(
        self, db: Session, user: User, workspace_id: str, data: dict
    ) -> dict:
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(WorkspaceErrorCodes.WORKSPACE_NOT_FOUND)
        if not self._can_access_workspace(db, user, workspace):
            raise ValueError(WorkspaceErrorCodes.ACCESS_DENIED)

        update_fields = {key: value for key, value in data.items()}
        if "name" in update_fields:
            update_fields["name"] = update_fields["name"].strip()
            if not update_fields["name"]:
                raise ValueError(WorkspaceErrorCodes.INVALID_WORKSPACE_NAME)
            self._assert_unique_workspace_name(
                db,
                update_fields["name"],
                user=user,
                exclude_workspace_id=workspace_id,
            )

        try:
            workspace_repository.update(db, workspace, **update_fields)
            db.commit()
            db.refresh(workspace)
            return _workspace_to_dict(workspace)
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to update workspace: {exc}")
            raise

    def delete_workspace(self, db: Session, user: User, workspace_id: str) -> None:
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(WorkspaceErrorCodes.WORKSPACE_NOT_FOUND)
        if not self._can_access_workspace(db, user, workspace):
            raise ValueError(WorkspaceErrorCodes.ACCESS_DENIED)

        try:
            workspace_repository.soft_delete(db, workspace)
            profile = self._get_user_profile(db, user.id)
            if profile and profile.activeWorkspaceId == workspace_id:
                profile.activeWorkspaceId = None
                db.add(profile)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to delete workspace: {exc}")
            raise

    def set_active_workspace(
        self, db: Session, user: User, workspace_id: str | None
    ) -> str | None:
        if workspace_id:
            workspace = workspace_repository.get_by_id(db, workspace_id)
            if not workspace or not self._can_access_workspace(db, user, workspace):
                raise ValueError(WorkspaceErrorCodes.ACTIVE_WORKSPACE_NOT_FOUND)

        profile = self._get_or_create_user_profile(db, user)

        try:
            profile.activeWorkspaceId = workspace_id
            db.add(profile)
            db.commit()
            return workspace_id
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to set active workspace: {exc}")
            raise

    def create_schedule(
        self, db: Session, user: User, workspace_id: str, data: dict
    ) -> dict:
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(WorkspaceErrorCodes.WORKSPACE_NOT_FOUND)
        if not self._can_access_workspace(db, user, workspace):
            raise ValueError(WorkspaceErrorCodes.ACCESS_DENIED)

        try:
            schedule = workspace_repository.create_schedule(
                db,
                workspaceId=workspace_id,
                platform=data.get("platform"),
                dayOfWeek=data.get("dayOfWeek"),
                time=data.get("time"),
                contentType=data.get("contentType"),
                label=data.get("label"),
                datetime=data.get("datetime"),
                recurrence=data.get("recurrence", "none"),
                publishAsDraft=data.get("publishAsDraft", False),
                enabled=data.get("enabled", True),
                nextRun=data.get("nextRun"),
            )
            db.commit()
            db.refresh(schedule)
            return _schedule_to_dict(schedule)
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to create schedule: {exc}")
            raise

    def update_schedule(
        self, db: Session, user: User, workspace_id: str, schedule_id: str, data: dict
    ) -> dict:
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(WorkspaceErrorCodes.WORKSPACE_NOT_FOUND)
        if not self._can_access_workspace(db, user, workspace):
            raise ValueError(WorkspaceErrorCodes.ACCESS_DENIED)

        schedule = workspace_repository.get_schedule_by_id(db, workspace_id, schedule_id)
        if not schedule:
            raise ValueError(WorkspaceErrorCodes.SCHEDULE_NOT_FOUND)

        update_fields = {key: value for key, value in data.items() if value is not None}

        try:
            workspace_repository.update_schedule(db, schedule, **update_fields)
            db.commit()
            db.refresh(schedule)
            return _schedule_to_dict(schedule)
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to update schedule: {exc}")
            raise

    def delete_schedule(
        self, db: Session, user: User, workspace_id: str, schedule_id: str
    ) -> None:
        workspace = workspace_repository.get_by_id(db, workspace_id)
        if not workspace:
            raise ValueError(WorkspaceErrorCodes.WORKSPACE_NOT_FOUND)
        if not self._can_access_workspace(db, user, workspace):
            raise ValueError(WorkspaceErrorCodes.ACCESS_DENIED)

        schedule = workspace_repository.get_schedule_by_id(db, workspace_id, schedule_id)
        if not schedule:
            raise ValueError(WorkspaceErrorCodes.SCHEDULE_NOT_FOUND)

        try:
            workspace_repository.delete_schedule(db, schedule)
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to delete schedule: {exc}")
            raise


workspace_service = WorkspaceService()
