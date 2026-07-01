"""create_route_permissions_table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-25 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'route_permissions',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('method', sa.String(length=10), nullable=False),
        sa.Column('path', sa.String(), nullable=False),
        sa.Column('permissionId', sa.String(length=26), nullable=False),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['permissionId'], ['permissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('method', 'path', 'permissionId', name='uq_route_permission')
    )
    op.create_index(op.f('ix_route_permissions_id'), 'route_permissions', ['id'], unique=False)
    op.create_index(op.f('ix_route_permissions_method'), 'route_permissions', ['method'], unique=False)
    op.create_index(op.f('ix_route_permissions_path'), 'route_permissions', ['path'], unique=False)
    op.create_index(op.f('ix_route_permissions_permissionId'), 'route_permissions', ['permissionId'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_route_permissions_permissionId'), table_name='route_permissions')
    op.drop_index(op.f('ix_route_permissions_path'), table_name='route_permissions')
    op.drop_index(op.f('ix_route_permissions_method'), table_name='route_permissions')
    op.drop_index(op.f('ix_route_permissions_id'), table_name='route_permissions')
    op.drop_table('route_permissions')
