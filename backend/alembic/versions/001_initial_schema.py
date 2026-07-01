"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-07-01
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "players",
        sa.Column("id",         sa.String(36),  primary_key=True),
        sa.Column("phone",      sa.String(10),  nullable=False, unique=True),
        sa.Column("nickname",   sa.String(100), nullable=False),
        sa.Column("pin_hash",   sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime,    nullable=True),
    )
    op.create_index("ix_players_phone", "players", ["phone"])

    op.create_table(
        "games",
        sa.Column("id",            sa.String(36),  primary_key=True),
        sa.Column("host_id",       sa.String(36),  sa.ForeignKey("players.id"), nullable=False),
        sa.Column("mode",          sa.String(10),  nullable=False),
        sa.Column("status",        sa.String(20),  nullable=False, server_default="completed"),
        sa.Column("claims_config", sa.JSON,        nullable=True),
        sa.Column("started_at",    sa.DateTime,    nullable=True),
        sa.Column("ended_at",      sa.DateTime,    nullable=True),
        sa.Column("synced_at",     sa.DateTime,    nullable=True),
    )

    op.create_table(
        "game_players",
        sa.Column("id",        sa.String(36), primary_key=True),
        sa.Column("game_id",   sa.String(36), sa.ForeignKey("games.id"),   nullable=False),
        sa.Column("player_id", sa.String(36), sa.ForeignKey("players.id"), nullable=True),
        sa.Column("nickname",  sa.String(100), nullable=False),
    )

    op.create_table(
        "called_numbers",
        sa.Column("id",             sa.String(36), primary_key=True),
        sa.Column("game_id",        sa.String(36), sa.ForeignKey("games.id"), nullable=False),
        sa.Column("number",         sa.Integer,    nullable=False),
        sa.Column("sequence_order", sa.Integer,    nullable=False),
        sa.Column("called_at",      sa.DateTime,   nullable=True),
    )

    op.create_table(
        "game_claims",
        sa.Column("id",               sa.String(36), primary_key=True),
        sa.Column("game_id",          sa.String(36), sa.ForeignKey("games.id"),   nullable=False),
        sa.Column("claim_type",       sa.String(50), nullable=False),
        sa.Column("winner_player_id", sa.String(36), sa.ForeignKey("players.id"), nullable=True),
        sa.Column("won_at",           sa.DateTime,   nullable=True),
    )

def downgrade() -> None:
    op.drop_table("game_claims")
    op.drop_table("called_numbers")
    op.drop_table("game_players")
    op.drop_table("games")
    op.drop_index("ix_players_phone", table_name="players")
    op.drop_table("players")
