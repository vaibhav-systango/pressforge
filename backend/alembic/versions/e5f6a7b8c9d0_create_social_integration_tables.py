"""create_social_connect_tables

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-09 15:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'oauth_states',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('state', sa.String(length=128), nullable=False),
        sa.Column('userId', sa.String(length=26), nullable=False),
        sa.Column('organizationId', sa.String(length=26), nullable=True),
        sa.Column('expiresAt', sa.BigInteger(), nullable=False),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['organizationId'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['userId'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('state'),
    )
    op.create_index(op.f('ix_oauth_states_id'), 'oauth_states', ['id'], unique=False)
    op.create_index(op.f('ix_oauth_states_state'), 'oauth_states', ['state'], unique=False)
    op.create_index(op.f('ix_oauth_states_userId'), 'oauth_states', ['userId'], unique=False)
    op.create_index(op.f('ix_oauth_states_organizationId'), 'oauth_states', ['organizationId'], unique=False)

    op.create_table(
        'social_accounts',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('userId', sa.String(length=26), nullable=False),
        sa.Column('organizationId', sa.String(length=26), nullable=True),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('externalAccountId', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=True),
        sa.Column('displayName', sa.String(), nullable=True),
        sa.Column('profilePictureUrl', sa.Text(), nullable=True),
        sa.Column('facebookPageId', sa.String(), nullable=True),
        sa.Column('accessToken', sa.Text(), nullable=False),
        sa.Column('tokenExpiresAt', sa.BigInteger(), nullable=True),
        sa.Column('scopes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('connectedAt', sa.BigInteger(), nullable=False),
        sa.Column('createdAt', sa.BigInteger(), nullable=False),
        sa.Column('updatedAt', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['organizationId'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['userId'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('userId', 'organizationId', 'platform', name='uq_social_account_user_org_platform'),
    )
    op.create_index(op.f('ix_social_accounts_id'), 'social_accounts', ['id'], unique=False)
    op.create_index(op.f('ix_social_accounts_userId'), 'social_accounts', ['userId'], unique=False)
    op.create_index(op.f('ix_social_accounts_organizationId'), 'social_accounts', ['organizationId'], unique=False)
    op.create_index(op.f('ix_social_accounts_platform'), 'social_accounts', ['platform'], unique=False)
    op.create_index(op.f('ix_social_accounts_externalAccountId'), 'social_accounts', ['externalAccountId'], unique=False)
    op.create_index(op.f('ix_social_accounts_status'), 'social_accounts', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_social_accounts_status'), table_name='social_accounts')
    op.drop_index(op.f('ix_social_accounts_externalAccountId'), table_name='social_accounts')
    op.drop_index(op.f('ix_social_accounts_platform'), table_name='social_accounts')
    op.drop_index(op.f('ix_social_accounts_organizationId'), table_name='social_accounts')
    op.drop_index(op.f('ix_social_accounts_userId'), table_name='social_accounts')
    op.drop_index(op.f('ix_social_accounts_id'), table_name='social_accounts')
    op.drop_table('social_accounts')

    op.drop_index(op.f('ix_oauth_states_organizationId'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_userId'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_state'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_id'), table_name='oauth_states')
    op.drop_table('oauth_states')
