from sqlalchemy import func, or_
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

    def _apply_filters(
        self,
        query,
        status: str | None = None,
        search: str | None = None,
        platform: str | None = None,
    ):
        if status and status != "all":
            if status in ("pending", "pending_approval"):
                query = query.filter(Draft.status == "pending_approval")
            elif status == "draft":
                query = query.filter(Draft.status == "draft")
            elif status == "approved":
                query = query.filter(Draft.status == "approved")
            elif status == "published":
                query = query.filter(Draft.status == "published")
            elif status == "approved_all":
                query = query.filter(Draft.status.in_(["approved", "published"]))
            elif status in ("generated", "generated_images", "generated_image", "images", "image"):
                query = query.filter(Draft.status == "generated")
            elif status == "rejected":
                query = query.filter(Draft.status == "rejected")
            else:
                query = query.filter(Draft.status == status)

        if platform and platform != "all":
            query = query.filter(or_(Draft.platform == platform, Draft.platform == "both"))

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Draft.prompt.ilike(term),
                    Draft.caption.ilike(term),
                    Draft.liCaption.ilike(term),
                )
            )

        return query

    def list_paginated(
        self,
        db: Session,
        *,
        workspace_ids: list[str],
        status: str | None = None,
        search: str | None = None,
        platform: str | None = None,
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[Draft], int]:
        if not workspace_ids:
            return [], 0

        query = db.query(Draft).filter(Draft.workspaceId.in_(workspace_ids))
        query = self._apply_filters(query, status=status, search=search, platform=platform)

        total = query.count()
        offset = (page - 1) * limit
        drafts = query.order_by(Draft.createdAt.desc()).offset(offset).limit(limit).all()

        return drafts, total

    def get_status_counts(
        self,
        db: Session,
        *,
        workspace_ids: list[str],
        search: str | None = None,
        platform: str | None = None,
    ) -> dict[str, int]:
        if not workspace_ids:
            return {"pending": 0, "approved": 0, "rejected": 0, "draft": 0, "published": 0, "generated": 0, "generated_images": 0, "all": 0}

        base_query = db.query(Draft.status, func.count(Draft.id)).filter(Draft.workspaceId.in_(workspace_ids))
        if platform and platform != "all":
            base_query = base_query.filter(or_(Draft.platform == platform, Draft.platform == "both"))
        if search and search.strip():
            term = f"%{search.strip()}%"
            base_query = base_query.filter(
                or_(
                    Draft.prompt.ilike(term),
                    Draft.caption.ilike(term),
                    Draft.liCaption.ilike(term),
                )
            )

        rows = base_query.group_by(Draft.status).all()

        counts_by_status = {st: cnt for st, cnt in rows}

        generated = counts_by_status.get("generated", 0)
        pending = counts_by_status.get("pending_approval", 0)
        approved = counts_by_status.get("approved", 0)
        rejected = counts_by_status.get("rejected", 0)
        draft = counts_by_status.get("draft", 0)
        published = counts_by_status.get("published", 0)
        total_all = sum(counts_by_status.values())

        return {
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "draft": draft,
            "published": published,
            "generated": generated,
            "generated_images": generated,
            "all": total_all,
        }

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
