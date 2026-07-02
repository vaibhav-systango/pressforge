"""create_roles_permissions_and_role_permissions_tables

Revision ID: a1b2c3d4e5f6
Revises: 0379440a909a
Create Date: 2026-06-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0379440a909a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'roles',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.Column('updatedAt', sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roles_id'), 'roles', ['id'], unique=False)
    op.create_index(op.f('ix_roles_name'), 'roles', ['name'], unique=True)
    op.create_index(op.f('ix_roles_isActive'), 'roles', ['isActive'], unique=False)

    op.create_table(
        'permissions',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.Column('updatedAt', sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'], unique=False)
    op.create_index(op.f('ix_permissions_name'), 'permissions', ['name'], unique=True)

    op.create_table(
        'role_permissions',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('roleId', sa.String(length=26), nullable=False),
        sa.Column('permissionId', sa.String(length=26), nullable=False),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['roleId'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permissionId'], ['permissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('roleId', 'permissionId', name='uq_role_permission')
    )
    op.create_index(op.f('ix_role_permissions_id'), 'role_permissions', ['id'], unique=False)
    op.create_index(op.f('ix_role_permissions_roleId'), 'role_permissions', ['roleId'], unique=False)
    op.create_index(op.f('ix_role_permissions_permissionId'), 'role_permissions', ['permissionId'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_role_permissions_permissionId'), table_name='role_permissions')
    op.drop_index(op.f('ix_role_permissions_roleId'), table_name='role_permissions')
    op.drop_index(op.f('ix_role_permissions_id'), table_name='role_permissions')
    op.drop_table('role_permissions')

    op.drop_index(op.f('ix_permissions_name'), table_name='permissions')
    op.drop_index(op.f('ix_permissions_id'), table_name='permissions')
    op.drop_table('permissions')

    op.drop_index(op.f('ix_roles_isActive'), table_name='roles')
    op.drop_index(op.f('ix_roles_name'), table_name='roles')
    op.drop_index(op.f('ix_roles_id'), table_name='roles')
    op.drop_table('roles')
