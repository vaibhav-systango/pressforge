"""merge heads

Revision ID: f20299943c7a
Revises: 8abcc735331f, k1f2a3b4c5d6
Create Date: 2026-07-15 20:20:52.668637

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f20299943c7a'
down_revision: Union[str, Sequence[str], None] = ('8abcc735331f', 'k1f2a3b4c5d6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
