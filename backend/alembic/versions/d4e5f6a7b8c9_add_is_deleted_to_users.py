"""add_is_deleted_to_users

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-07-03 18:27:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add as nullable first, backfill, then enforce NOT NULL
    op.add_column('users', sa.Column('isDeleted', sa.Boolean(), nullable=True))
    op.execute("UPDATE users SET \"isDeleted\" = FALSE")
    op.alter_column('users', 'isDeleted', nullable=False)
    op.create_index(op.f('ix_users_isDeleted'), 'users', ['isDeleted'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_isDeleted'), table_name='users')
    op.drop_column('users', 'isDeleted')
