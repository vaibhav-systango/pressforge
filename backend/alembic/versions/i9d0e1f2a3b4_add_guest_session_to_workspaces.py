"""add_guest_session_to_workspaces

Revision ID: i9d0e1f2a3b4
Revises: h8c9d0e1f2a3
Create Date: 2026-07-10 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'i9d0e1f2a3b4'
down_revision: Union[str, Sequence[str], None] = 'h8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('workspaces', sa.Column('guestSessionId', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_workspaces_guestSessionId'), 'workspaces', ['guestSessionId'], unique=False)
    op.alter_column('workspaces', 'ownerUserId', existing_type=sa.String(length=26), nullable=True)


def downgrade() -> None:
    op.alter_column('workspaces', 'ownerUserId', existing_type=sa.String(length=26), nullable=False)
    op.drop_index(op.f('ix_workspaces_guestSessionId'), table_name='workspaces')
    op.drop_column('workspaces', 'guestSessionId')
