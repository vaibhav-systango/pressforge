"""add_prompt_to_workspaces

Revision ID: m3b4c5d6e7f8
Revises: l2a3b4c5d6e7
Create Date: 2026-09-01 11:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "m3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "6cf598d8eb65"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _column_exists("workspaces", "prompt"):
        op.add_column("workspaces", sa.Column("prompt", sa.Text(), nullable=True))


def downgrade() -> None:
    if _column_exists("workspaces", "prompt"):
        op.drop_column("workspaces", "prompt")
