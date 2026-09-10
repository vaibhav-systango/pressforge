"""create_invitations_table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-25 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'invitations',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('fullName', sa.String(), nullable=False),
        sa.Column('organizationId', sa.String(length=26), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('invitedBy', sa.String(length=26), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='PENDING'),
        sa.Column('expiresAt', sa.BigInteger(), nullable=False),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['organizationId'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invitedBy'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invitations_id'), 'invitations', ['id'], unique=False)
    op.create_index(op.f('ix_invitations_email'), 'invitations', ['email'], unique=False)
    op.create_index(op.f('ix_invitations_organizationId'), 'invitations', ['organizationId'], unique=False)
    op.create_index(op.f('ix_invitations_status'), 'invitations', ['status'], unique=False)
    op.create_index(
        'uq_invitations_pending_email_org',
        'invitations',
        [sa.text('LOWER(email)'), 'organizationId'],
        unique=True,
        postgresql_where=sa.text("status = 'PENDING'"),
    )


def downgrade() -> None:
    op.drop_index('uq_invitations_pending_email_org', table_name='invitations')
    op.drop_index(op.f('ix_invitations_status'), table_name='invitations')
    op.drop_index(op.f('ix_invitations_organizationId'), table_name='invitations')
    op.drop_index(op.f('ix_invitations_email'), table_name='invitations')
    op.drop_index(op.f('ix_invitations_id'), table_name='invitations')
    op.drop_table('invitations')
