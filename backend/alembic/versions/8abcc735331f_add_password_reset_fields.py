"""add_password_reset_fields

Revision ID: 8abcc735331f
Revises: 42c69d40fc12
Create Date: 2026-07-15 13:46:27.281137

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '8abcc735331f'
down_revision: Union[str, Sequence[str], None] = '42c69d40fc12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def upgrade() -> None:
    """Upgrade schema."""
    if not _column_exists('users', 'passwordResetCode'):
        op.add_column('users', sa.Column('passwordResetCode', sa.String(), nullable=True))
    if not _column_exists('users', 'passwordResetExpiresAt'):
        op.add_column('users', sa.Column('passwordResetExpiresAt', sa.BigInteger(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    if _column_exists('users', 'passwordResetExpiresAt'):
        op.drop_column('users', 'passwordResetExpiresAt')
    if _column_exists('users', 'passwordResetCode'):
        op.drop_column('users', 'passwordResetCode')

