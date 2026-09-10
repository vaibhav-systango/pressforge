"""create_member_workspaces

Revision ID: e5d4fef365c5
Revises: j0e1f2a3b4c5
Create Date: 2026-07-13 17:35:25.636973

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5d4fef365c5'
down_revision: Union[str, Sequence[str], None] = 'j0e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('member_workspaces',
        sa.Column('memberId', sa.String(length=26), nullable=False),
        sa.Column('workspaceId', sa.String(length=26), nullable=False),
        sa.ForeignKeyConstraint(['memberId'], ['organization_members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspaceId'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('memberId', 'workspaceId')
    )
    op.create_index(op.f('ix_member_workspaces_memberId'), 'member_workspaces', ['memberId'], unique=False)
    op.create_index(op.f('ix_member_workspaces_workspaceId'), 'member_workspaces', ['workspaceId'], unique=False)

    # Migrate existing data from organization_members to member_workspaces
    op.execute(
        'INSERT INTO member_workspaces ("memberId", "workspaceId") '
        'SELECT id, "workspaceId" FROM organization_members '
        'WHERE "workspaceId" IS NOT NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_member_workspaces_workspaceId'), table_name='member_workspaces')
    op.drop_index(op.f('ix_member_workspaces_memberId'), table_name='member_workspaces')
    op.drop_table('member_workspaces')

