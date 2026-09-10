"""drop_publish_jobs_table

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-07-09 16:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not _table_exists('publish_jobs'):
        return

    op.drop_index(op.f('ix_publish_jobs_scheduledAt'), table_name='publish_jobs')
    op.drop_index(op.f('ix_publish_jobs_status'), table_name='publish_jobs')
    op.drop_index(op.f('ix_publish_jobs_organizationId'), table_name='publish_jobs')
    op.drop_index(op.f('ix_publish_jobs_userId'), table_name='publish_jobs')
    op.drop_index(op.f('ix_publish_jobs_socialAccountId'), table_name='publish_jobs')
    op.drop_index(op.f('ix_publish_jobs_id'), table_name='publish_jobs')
    op.drop_table('publish_jobs')


def downgrade() -> None:
    if _table_exists('publish_jobs'):
        return

    op.create_table(
        'publish_jobs',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('socialAccountId', sa.String(length=26), nullable=False),
        sa.Column('userId', sa.String(length=26), nullable=False),
        sa.Column('organizationId', sa.String(length=26), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('mediaType', sa.String(), nullable=False),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('mediaUrl', sa.Text(), nullable=True),
        sa.Column('mediaUrls', sa.Text(), nullable=True),
        sa.Column('scheduledAt', sa.BigInteger(), nullable=True),
        sa.Column('publishedAt', sa.BigInteger(), nullable=True),
        sa.Column('externalMediaId', sa.String(), nullable=True),
        sa.Column('errorMessage', sa.Text(), nullable=True),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.Column('updatedAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['organizationId'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['socialAccountId'], ['social_accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['userId'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_publish_jobs_id'), 'publish_jobs', ['id'], unique=False)
    op.create_index(op.f('ix_publish_jobs_socialAccountId'), 'publish_jobs', ['socialAccountId'], unique=False)
    op.create_index(op.f('ix_publish_jobs_userId'), 'publish_jobs', ['userId'], unique=False)
    op.create_index(op.f('ix_publish_jobs_organizationId'), 'publish_jobs', ['organizationId'], unique=False)
    op.create_index(op.f('ix_publish_jobs_status'), 'publish_jobs', ['status'], unique=False)
    op.create_index(op.f('ix_publish_jobs_scheduledAt'), 'publish_jobs', ['scheduledAt'], unique=False)
