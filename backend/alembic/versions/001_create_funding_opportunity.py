"""
Alembic revision: 001_create_funding_opportunity
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Creates the `funding_opportunities` table with all fields required by the
FundingOpportunity data contract agreed with Members 5 and 6.

Revision ID : 001
Revises     : (none — first migration)
Create Date : 2026-09-08
"""

from alembic import op
import sqlalchemy as sa

# ── Revision metadata ─────────────────────────────────────────────────────────
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "funding_opportunities",

        # ── Primary key ───────────────────────────────────────────────────────
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),

        # ── Deduplication keys ────────────────────────────────────────────────
        sa.Column("external_id", sa.String(512), nullable=False),
        sa.Column("source",      sa.String(64),  nullable=False),

        # ── Core identity fields ──────────────────────────────────────────────
        sa.Column("title",        sa.String(1024), nullable=False),
        sa.Column("organization", sa.String(512),  nullable=False, server_default=""),
        sa.Column("description",  sa.Text(),        nullable=True),

        # ── Financial ─────────────────────────────────────────────────────────
        sa.Column("funding_amount", sa.Numeric(18, 2), nullable=True),
        sa.Column("currency",       sa.String(8),      nullable=False, server_default="USD"),

        # ── Timing ────────────────────────────────────────────────────────────
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),

        # ── Classification ────────────────────────────────────────────────────
        sa.Column("eligibility",    sa.Text(),       nullable=True),
        sa.Column("research_areas", sa.JSON(),       nullable=False, server_default="[]"),
        sa.Column("keywords",       sa.JSON(),       nullable=False, server_default="[]"),
        sa.Column("funding_type",   sa.String(64),   nullable=False, server_default="grant"),
        sa.Column("country",        sa.String(4),    nullable=False, server_default="US"),

        # ── Source URLs ───────────────────────────────────────────────────────
        sa.Column("source_url",      sa.String(2048), nullable=True),
        sa.Column("application_url", sa.String(2048), nullable=True),

        # ── Lifecycle ─────────────────────────────────────────────────────────
        sa.Column("status", sa.String(16), nullable=False, server_default="active"),

        # ── Audit timestamps ──────────────────────────────────────────────────
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # ── Unique constraint (deduplication) ─────────────────────────────────────
    op.create_unique_constraint(
        "uq_funding_ext_id_source",
        "funding_opportunities",
        ["external_id", "source"],
    )

    # ── Search indexes ────────────────────────────────────────────────────────
    op.create_index("ix_funding_status",       "funding_opportunities", ["status"])
    op.create_index("ix_funding_deadline",     "funding_opportunities", ["deadline"])
    op.create_index("ix_funding_funding_type", "funding_opportunities", ["funding_type"])
    op.create_index("ix_funding_country",      "funding_opportunities", ["country"])
    op.create_index("ix_funding_source",       "funding_opportunities", ["source"])


def downgrade() -> None:
    op.drop_index("ix_funding_source",       table_name="funding_opportunities")
    op.drop_index("ix_funding_country",      table_name="funding_opportunities")
    op.drop_index("ix_funding_funding_type", table_name="funding_opportunities")
    op.drop_index("ix_funding_deadline",     table_name="funding_opportunities")
    op.drop_index("ix_funding_status",       table_name="funding_opportunities")
    op.drop_table("funding_opportunities")
