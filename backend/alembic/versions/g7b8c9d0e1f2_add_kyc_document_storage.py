"""add_kyc_document_storage

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-07-10 14:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = 'g7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(table_name: str, column_name: str, column: sa.Column) -> None:
    if column_name not in _column_names(table_name):
        op.add_column(table_name, column)


def upgrade() -> None:
    org_columns = _column_names('organization_kyc')
    if 'businessDocumentFileKey' in org_columns:
        op.alter_column('organization_kyc', 'businessDocumentFileKey', new_column_name='documentPublicId')
    elif 'documentPublicId' not in org_columns:
        _add_column_if_missing('organization_kyc', 'documentPublicId', sa.Column('documentPublicId', sa.String(), nullable=True))

    org_columns = _column_names('organization_kyc')
    if 'businessDocumentUrl' in org_columns:
        op.alter_column('organization_kyc', 'businessDocumentUrl', new_column_name='documentSecureUrl')
    elif 'documentSecureUrl' not in org_columns:
        _add_column_if_missing('organization_kyc', 'documentSecureUrl', sa.Column('documentSecureUrl', sa.Text(), nullable=True))

    _add_column_if_missing('organization_kyc', 'documentResourceType', sa.Column('documentResourceType', sa.String(), nullable=True))
    _add_column_if_missing('organization_kyc', 'documentFormat', sa.Column('documentFormat', sa.String(), nullable=True))
    _add_column_if_missing('organization_kyc', 'documentBytes', sa.Column('documentBytes', sa.BigInteger(), nullable=True))
    _add_column_if_missing('organization_kyc', 'documentOriginalFilename', sa.Column('documentOriginalFilename', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('organization_kyc', 'documentOriginalFilename')
    op.drop_column('organization_kyc', 'documentBytes')
    op.drop_column('organization_kyc', 'documentFormat')
    op.drop_column('organization_kyc', 'documentResourceType')

    org_columns = _column_names('organization_kyc')
    if 'documentSecureUrl' in org_columns:
        op.alter_column('organization_kyc', 'documentSecureUrl', new_column_name='businessDocumentUrl')
    if 'documentPublicId' in org_columns:
        op.alter_column('organization_kyc', 'documentPublicId', new_column_name='businessDocumentFileKey')
