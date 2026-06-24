"""add_metadata_and_hash_to_screenshots

Revision ID: 002_metadata_hash
Revises: 001_initial_users
Create Date: 2026-06-02

Adds:
- file_hash  (VARCHAR, nullable, indexed) — SHA-256 for duplicate detection
- subcategory (VARCHAR, nullable)
- summary     (TEXT, nullable)
- tags        (JSON, nullable)
- extracted_entities (JSON, nullable)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '002_metadata_hash'
down_revision: Union[str, None] = '001_initial_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('screenshots', sa.Column('file_hash', sa.String(), nullable=True))
    op.add_column('screenshots', sa.Column('subcategory', sa.String(), nullable=True))
    op.add_column('screenshots', sa.Column('summary', sa.Text(), nullable=True))
    op.add_column('screenshots', sa.Column('tags', sa.JSON(), nullable=True))
    op.add_column('screenshots', sa.Column('extracted_entities', sa.JSON(), nullable=True))
    op.create_index(op.f('ix_screenshots_file_hash'), 'screenshots', ['file_hash'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_screenshots_file_hash'), table_name='screenshots')
    op.drop_column('screenshots', 'extracted_entities')
    op.drop_column('screenshots', 'tags')
    op.drop_column('screenshots', 'summary')
    op.drop_column('screenshots', 'subcategory')
    op.drop_column('screenshots', 'file_hash')
