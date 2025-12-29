"""Change category_id to Integer in logger_entries

Revision ID: d3d6056f0834
Revises: 9e6d47843931
Create Date: 2025-12-29 00:34:06.989538

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3d6056f0834'
down_revision: Union[str, Sequence[str], None] = '9e6d47843931'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the column and recreate it to avoid casting issues
    op.drop_column('logger_entries', 'category_id')
    op.add_column('logger_entries', sa.Column('category_id', sa.Integer(), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    # Reverse the operation
    op.drop_column('logger_entries', 'category_id')
    op.add_column('logger_entries', sa.Column('category_id', sa.UUID(), nullable=False))