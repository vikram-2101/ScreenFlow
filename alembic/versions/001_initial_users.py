"""add_users_and_user_id_to_screenshots

Revision ID: 001_initial_users
Revises: 
Create Date: 2026-05-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_users'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('plan', sa.Enum('free', 'pro', 'business', name='planenum'), nullable=False),
        sa.Column('google_calendar_token', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Check if screenshots table exists - if it doesn't, create it
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'screenshots' not in inspector.get_table_names():
        # Create screenshots table from scratch
        op.create_table(
            'screenshots',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('user_id', sa.String(), nullable=False),
            sa.Column('original_filename', sa.String(), nullable=False),
            sa.Column('smart_filename', sa.String(), nullable=False),
            sa.Column('file_path', sa.String(), nullable=False),
            sa.Column('category', sa.String(), nullable=True),
            sa.Column('extracted_text', sa.Text(), nullable=True),
            sa.Column('confidence', sa.Float(), nullable=True),
            sa.Column('status', sa.String(), nullable=False),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        )
        op.create_index(op.f('ix_screenshots_user_id'), 'screenshots', ['user_id'], unique=False)
    else:
        # If screenshots table already exists, just add the user_id column
        op.add_column('screenshots', sa.Column('user_id', sa.String(), nullable=True))
        
        # Create a default user and assign all existing screenshots to it
        # This is a fallback for existing databases
        try:
            op.execute('''
                INSERT INTO users (id, email, password_hash, plan, created_at, updated_at)
                VALUES ('default-user', 'default@screenflow.local', 'placeholder', 'free', NOW(), NOW())
                ON CONFLICT DO NOTHING
            ''')
            op.execute('UPDATE screenshots SET user_id = \'default-user\' WHERE user_id IS NULL')
        except:
            pass
        
        # Make user_id NOT NULL and add FK
        op.alter_column('screenshots', 'user_id', existing_type=sa.String(), nullable=False)
        op.create_foreign_key(
            'fk_screenshots_user_id_users',
            'screenshots',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )
        op.create_index(op.f('ix_screenshots_user_id'), 'screenshots', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop FK and index
    op.drop_index(op.f('ix_screenshots_user_id'), table_name='screenshots')
    op.drop_constraint('fk_screenshots_user_id_users', 'screenshots', type_='foreignkey')
    
    # Remove user_id column from screenshots
    op.drop_column('screenshots', 'user_id')

    # Drop users table
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
