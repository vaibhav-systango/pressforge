"""add_workspace_to_organization_members

Revision ID: j0e1f2a3b4c5
Revises: i9d0e1f2a3b4
Create Date: 2026-07-13 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'j0e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = 'i9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'organization_members',
        sa.Column('workspaceId', sa.String(length=26), nullable=True),
    )
    op.create_index(
        op.f('ix_organization_members_workspaceId'),
        'organization_members',
        ['workspaceId'],
        unique=False,
    )
    op.create_foreign_key(
        'fk_organization_members_workspaceId',
        'organization_members',
        'workspaces',
        ['workspaceId'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint(
        'fk_organization_members_workspaceId',
        'organization_members',
        type_='foreignkey',
    )
    op.drop_index(op.f('ix_organization_members_workspaceId'), table_name='organization_members')
    op.drop_column('organization_members', 'workspaceId')
