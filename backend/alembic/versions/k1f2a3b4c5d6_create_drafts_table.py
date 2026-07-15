"""create_drafts_table

Revision ID: k1f2a3b4c5d6
Revises: j0e1f2a3b4c5
Create Date: 2026-07-14 13:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "j0e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "drafts",
        sa.Column("id", sa.String(length=26), nullable=False),
        sa.Column("workspaceId", sa.String(length=26), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("platform", sa.String(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("scheduledAt", sa.String(), nullable=True),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("hashtags", sa.JSON(), nullable=False),
        sa.Column("imageBrief", sa.Text(), nullable=True),
        sa.Column("imageUrl", sa.String(), nullable=True),
        sa.Column("liCaption", sa.Text(), nullable=True),
        sa.Column("liHashtags", sa.JSON(), nullable=False),
        sa.Column("liImageBrief", sa.Text(), nullable=True),
        sa.Column("goal", sa.String(), nullable=True),
        sa.Column("cta", sa.String(), nullable=True),
        sa.Column("visualStyle", sa.String(), nullable=True),
        sa.Column("referenceUrls", sa.JSON(), nullable=False),
        sa.Column("referenceText", sa.Text(), nullable=True),
        sa.Column("history", sa.JSON(), nullable=False),
        sa.Column("createdAt", sa.BigInteger(), nullable=False),
        sa.Column("updatedAt", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["workspaceId"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_drafts_id"), "drafts", ["id"], unique=False)
    op.create_index(op.f("ix_drafts_workspaceId"), "drafts", ["workspaceId"], unique=False)
    op.create_index(op.f("ix_drafts_status"), "drafts", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_drafts_status"), table_name="drafts")
    op.drop_index(op.f("ix_drafts_workspaceId"), table_name="drafts")
    op.drop_index(op.f("ix_drafts_id"), table_name="drafts")
    op.drop_table("drafts")
