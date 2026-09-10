"""merge remaining heads

Revision ID: 6cf598d8eb65
Revises: f20299943c7a, l2a3b4c5d6e7
Create Date: 2026-07-17 15:25:34.693774

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6cf598d8eb65'
down_revision: Union[str, Sequence[str], None] = ('f20299943c7a', 'l2a3b4c5d6e7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
