"""add_password_reset_fields

Revision ID: 8abcc735331f
Revises: 42c69d40fc12
Create Date: 2026-07-15 13:46:27.281137

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8abcc735331f'
down_revision: Union[str, Sequence[str], None] = '42c69d40fc12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('passwordResetCode', sa.String(), nullable=True))
    op.add_column('users', sa.Column('passwordResetExpiresAt', sa.BigInteger(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'passwordResetCode')
    op.drop_column('users', 'passwordResetExpiresAt')

