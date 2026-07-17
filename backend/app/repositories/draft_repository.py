from sqlalchemy.orm import Session

from app.models.draft import Draft


class DraftRepository:
    def create(self, db: Session, **kwargs) -> Draft:
        draft = Draft(**kwargs)
        db.add(draft)
        db.flush()
        return draft

    def get_by_id(self, db: Session, draft_id: str) -> Draft | None:
        return db.query(Draft).filter(Draft.id == draft_id).first()

    def list_by_workspace(self, db: Session, workspace_id: str) -> list[Draft]:
        return (
            db.query(Draft)
            .filter(Draft.workspaceId == workspace_id)
            .order_by(Draft.createdAt.desc())
            .all()
        )

    def list_by_workspaces(self, db: Session, workspace_ids: list[str]) -> list[Draft]:
        if not workspace_ids:
            return []
        return (
            db.query(Draft)
            .filter(Draft.workspaceId.in_(workspace_ids))
            .order_by(Draft.createdAt.desc())
            .all()
        )

    def list_approved(self, db: Session, *, limit: int = 50) -> list[Draft]:
        """Oldest approved drafts first — candidates for the publish queue."""
        return (
            db.query(Draft)
            .filter(Draft.status == "approved")
            .order_by(Draft.createdAt.asc())
            .limit(limit)
            .all()
        )

    def update(self, db: Session, draft: Draft, **kwargs) -> Draft:
        for key, value in kwargs.items():
            if value is not None or key in (
                "scheduledAt",
                "caption",
                "imageBrief",
                "imageUrl",
                "liCaption",
                "liImageBrief",
                "goal",
                "cta",
                "visualStyle",
                "referenceText",
                "platform",
                "publishError",
            ):
                setattr(draft, key, value)
        db.flush()
        return draft


draft_repository = DraftRepository()
