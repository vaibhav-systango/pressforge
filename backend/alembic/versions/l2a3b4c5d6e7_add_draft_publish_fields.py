"""add_draft_publish_fields

Revision ID: l2a3b4c5d6e7
Revises: 42c69d40fc12, f6a7b8c9d0e1, k1f2a3b4c5d6
Create Date: 2026-07-16 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "l2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = (
    "42c69d40fc12",
    "f6a7b8c9d0e1",
    "k1f2a3b4c5d6",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _column_exists("drafts", "publishedAt"):
        op.add_column("drafts", sa.Column("publishedAt", sa.BigInteger(), nullable=True))
    if not _column_exists("drafts", "externalPostId"):
        op.add_column("drafts", sa.Column("externalPostId", sa.String(), nullable=True))
    if not _column_exists("drafts", "publishError"):
        op.add_column("drafts", sa.Column("publishError", sa.Text(), nullable=True))


def downgrade() -> None:
    if _column_exists("drafts", "publishError"):
        op.drop_column("drafts", "publishError")
    if _column_exists("drafts", "externalPostId"):
        op.drop_column("drafts", "externalPostId")
    if _column_exists("drafts", "publishedAt"):
        op.drop_column("drafts", "publishedAt")
