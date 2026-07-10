"""create_workspace_tables

Revision ID: h8c9d0e1f2a3
Revises: g7b8c9d0e1f2
Create Date: 2026-07-10 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h8c9d0e1f2a3'
down_revision: Union[str, Sequence[str], None] = 'g7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'workspaces',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('organizationId', sa.String(length=26), nullable=True),
        sa.Column('ownerUserId', sa.String(length=26), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('industry', sa.String(), nullable=True),
        sa.Column('targetAudience', sa.Text(), nullable=True),
        sa.Column('brandVoice', sa.Text(), nullable=True),
        sa.Column('logoUrl', sa.String(), nullable=True),
        sa.Column('tone', sa.String(), nullable=True),
        sa.Column('keywords', sa.JSON(), nullable=False),
        sa.Column('rules', sa.JSON(), nullable=False),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.Column('updatedAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['organizationId'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ownerUserId'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_workspaces_id'), 'workspaces', ['id'], unique=False)
    op.create_index(op.f('ix_workspaces_organizationId'), 'workspaces', ['organizationId'], unique=False)
    op.create_index(op.f('ix_workspaces_ownerUserId'), 'workspaces', ['ownerUserId'], unique=False)
    op.create_index(op.f('ix_workspaces_name'), 'workspaces', ['name'], unique=False)
    op.create_index(op.f('ix_workspaces_isActive'), 'workspaces', ['isActive'], unique=False)

    op.create_table(
        'workspace_schedules',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('workspaceId', sa.String(length=26), nullable=False),
        sa.Column('platform', sa.String(), nullable=True),
        sa.Column('dayOfWeek', sa.String(), nullable=True),
        sa.Column('time', sa.String(), nullable=True),
        sa.Column('contentType', sa.String(), nullable=True),
        sa.Column('label', sa.String(), nullable=True),
        sa.Column('datetime', sa.String(), nullable=True),
        sa.Column('recurrence', sa.String(), nullable=False),
        sa.Column('publishAsDraft', sa.Boolean(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('nextRun', sa.String(), nullable=True),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.Column('updatedAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['workspaceId'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_workspace_schedules_id'), 'workspace_schedules', ['id'], unique=False)
    op.create_index(op.f('ix_workspace_schedules_workspaceId'), 'workspace_schedules', ['workspaceId'], unique=False)

    op.add_column('user_profiles', sa.Column('activeWorkspaceId', sa.String(length=26), nullable=True))
    op.create_foreign_key(
        'fk_user_profiles_activeWorkspaceId',
        'user_profiles',
        'workspaces',
        ['activeWorkspaceId'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_user_profiles_activeWorkspaceId', 'user_profiles', type_='foreignkey')
    op.drop_column('user_profiles', 'activeWorkspaceId')

    op.drop_index(op.f('ix_workspace_schedules_workspaceId'), table_name='workspace_schedules')
    op.drop_index(op.f('ix_workspace_schedules_id'), table_name='workspace_schedules')
    op.drop_table('workspace_schedules')

    op.drop_index(op.f('ix_workspaces_isActive'), table_name='workspaces')
    op.drop_index(op.f('ix_workspaces_name'), table_name='workspaces')
    op.drop_index(op.f('ix_workspaces_ownerUserId'), table_name='workspaces')
    op.drop_index(op.f('ix_workspaces_organizationId'), table_name='workspaces')
    op.drop_index(op.f('ix_workspaces_id'), table_name='workspaces')
    op.drop_table('workspaces')
