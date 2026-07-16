from sqlalchemy.orm import Session, joinedload

from app.models.organization_member import OrganizationMember, OrganizationRole
from app.models.workspace import Workspace
from app.models.workspace_schedule import WorkspaceSchedule


class WorkspaceRepository:

    def create(
        self,
        db: Session,
        *,
        name: str,
        ownerUserId: str | None = None,
        guestSessionId: str | None = None,
        organizationId: str | None = None,
        website: str | None = None,
        description: str | None = None,
        industry: str | None = None,
        targetAudience: str | None = None,
        brandVoice: str | None = None,
        logoUrl: str | None = None,
        tone: str | None = None,
        keywords: list[str] | None = None,
        rules: list[str] | None = None,
    ) -> Workspace:
        workspace = Workspace(
            name=name,
            ownerUserId=ownerUserId,
            guestSessionId=guestSessionId,
            organizationId=organizationId,
            website=website,
            description=description,
            industry=industry,
            targetAudience=targetAudience,
            brandVoice=brandVoice,
            logoUrl=logoUrl,
            tone=tone,
            keywords=keywords or [],
            rules=rules or [],
        )
        db.add(workspace)
        db.flush()
        return workspace

    def get_by_id(self, db: Session, workspace_id: str) -> Workspace | None:
        return (
            db.query(Workspace)
            .options(joinedload(Workspace.schedules))
            .filter(Workspace.id == workspace_id, Workspace.isActive.is_(True))
            .first()
        )

    def list_by_owner(self, db: Session, owner_user_id: str) -> list[Workspace]:
        return (
            db.query(Workspace)
            .options(joinedload(Workspace.schedules))
            .filter(
                Workspace.ownerUserId == owner_user_id,
                Workspace.organizationId.is_(None),
                Workspace.isActive.is_(True),
            )
            .order_by(Workspace.createdAt.asc())
            .all()
        )

    def list_by_organization(self, db: Session, organization_id: str) -> list[Workspace]:
        return (
            db.query(Workspace)
            .options(joinedload(Workspace.schedules))
            .filter(
                Workspace.organizationId == organization_id,
                Workspace.isActive.is_(True),
            )
            .order_by(Workspace.createdAt.asc())
            .all()
        )

    def list_by_organization_and_client(
        self,
        db: Session,
        organization_id: str,
        client_user_id: str,
    ) -> list[Workspace]:
        from app.models.organization_member import MemberWorkspace
        
        # M2M relationship query
        m2m_workspaces = (
            db.query(Workspace)
            .options(joinedload(Workspace.schedules))
            .join(
                MemberWorkspace,
                MemberWorkspace.workspaceId == Workspace.id,
            )
            .join(
                OrganizationMember,
                OrganizationMember.id == MemberWorkspace.memberId,
            )
            .filter(
                Workspace.organizationId == organization_id,
                Workspace.isActive.is_(True),
                OrganizationMember.organizationId == organization_id,
                OrganizationMember.userId == client_user_id,
                OrganizationMember.role == OrganizationRole.CLIENT.value,
            )
            .all()
        )

        # Legacy column query
        legacy_workspaces = (
            db.query(Workspace)
            .options(joinedload(Workspace.schedules))
            .join(
                OrganizationMember,
                OrganizationMember.workspaceId == Workspace.id,
            )
            .filter(
                Workspace.organizationId == organization_id,
                Workspace.isActive.is_(True),
                OrganizationMember.organizationId == organization_id,
                OrganizationMember.userId == client_user_id,
                OrganizationMember.role == OrganizationRole.CLIENT.value,
            )
            .all()
        )

        # Combine, deduplicate, and sort by creation time
        combined = {w.id: w for w in m2m_workspaces + legacy_workspaces}
        return sorted(list(combined.values()), key=lambda w: w.createdAt)


    def list_by_guest_session(self, db: Session, guest_session_id: str) -> list[Workspace]:
        return (
            db.query(Workspace)
            .options(joinedload(Workspace.schedules))
            .filter(
                Workspace.guestSessionId == guest_session_id,
                Workspace.ownerUserId.is_(None),
                Workspace.isActive.is_(True),
            )
            .order_by(Workspace.createdAt.asc())
            .all()
        )

    def update(self, db: Session, workspace: Workspace, **fields) -> Workspace:
        for key, value in fields.items():
            setattr(workspace, key, value)
        db.add(workspace)
        db.flush()
        return workspace

    def soft_delete(self, db: Session, workspace: Workspace) -> None:
        workspace.isActive = False
        db.add(workspace)
        db.flush()

    def create_schedule(
        self,
        db: Session,
        *,
        workspaceId: str,
        platform: str | None = None,
        dayOfWeek: str | None = None,
        time: str | None = None,
        contentType: str | None = None,
        label: str | None = None,
        datetime: str | None = None,
        recurrence: str = "none",
        publishAsDraft: bool = False,
        enabled: bool = True,
        nextRun: str | None = None,
    ) -> WorkspaceSchedule:
        schedule = WorkspaceSchedule(
            workspaceId=workspaceId,
            platform=platform,
            dayOfWeek=dayOfWeek,
            time=time,
            contentType=contentType,
            label=label,
            datetime=datetime,
            recurrence=recurrence,
            publishAsDraft=publishAsDraft,
            enabled=enabled,
            nextRun=nextRun,
        )
        db.add(schedule)
        db.flush()
        return schedule

    def get_schedule_by_id(
        self, db: Session, workspace_id: str, schedule_id: str
    ) -> WorkspaceSchedule | None:
        return (
            db.query(WorkspaceSchedule)
            .filter(
                WorkspaceSchedule.id == schedule_id,
                WorkspaceSchedule.workspaceId == workspace_id,
            )
            .first()
        )

    def update_schedule(self, db: Session, schedule: WorkspaceSchedule, **fields) -> WorkspaceSchedule:
        for key, value in fields.items():
            setattr(schedule, key, value)
        db.add(schedule)
        db.flush()
        return schedule

    def delete_schedule(self, db: Session, schedule: WorkspaceSchedule) -> None:
        db.delete(schedule)
        db.flush()


workspace_repository = WorkspaceRepository()
