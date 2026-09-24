"""
backend/app/models/funding.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

SQLAlchemy ORM model for FundingOpportunity.

Design notes:
  - `external_id` + `source` together form the natural deduplication key.
  - List fields (research_areas, keywords) are stored as JSON so the model
    works with both SQLite (dev) and PostgreSQL (prod) without conditional
    column types.
  - `funding_amount` is Numeric(18, 2) to avoid floating-point rounding.
  - `status` defaults to 'active'; the sync job sets it to 'expired' when
    the deadline has passed.
  - `created_at` / `updated_at` are set automatically by the ORM.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class FundingOpportunity(Base):
    """
    Normalised representation of a funding opportunity ingested from one or
    more external sources (NIH RePORTER, Grants.gov, …).

    Data contract (Member 5 handoff):
        id              UUID primary key
        external_id     Source-specific ID (e.g., NIH project number)
        title           Opportunity / grant title
        organization    Funding organisation name
        description     Full opportunity description / abstract
        funding_amount  Award amount (Decimal, may be NULL)
        currency        ISO-4217 currency code, default 'USD'
        deadline        Application deadline (UTC datetime, may be NULL)
        eligibility     Free-text eligibility criteria (may be NULL)
        research_areas  List[str] of normalised research area labels
        keywords        List[str] of keywords extracted from source
        funding_type    Category: 'grant' | 'fellowship' | 'contract' | 'other'
        country         ISO-3166-1 alpha-2 country code, default 'US'
        source          Source identifier: 'nih_reporter' | 'grants_gov'
        source_url      Direct link to the source record
        application_url Direct application URL (may equal source_url)
        status          'active' | 'expired' | 'closed'
        created_at      UTC timestamp of first ingestion
        updated_at      UTC timestamp of last update
    """

    __tablename__ = "funding_opportunities"

    # ── Primary key ───────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ── Deduplication keys ────────────────────────────────────────────────────
    external_id: Mapped[str] = mapped_column(String(512), nullable=False)
    source: Mapped[str] = mapped_column(String(64), nullable=False)

    # ── Core fields ───────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(1024), nullable=False)
    organization: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Financial ─────────────────────────────────────────────────────────────
    funding_amount: Mapped[float | None] = mapped_column(
        Numeric(18, 2), nullable=True
    )
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")

    # ── Timing ────────────────────────────────────────────────────────────────
    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Eligibility / classification ──────────────────────────────────────────
    eligibility: Mapped[str | None] = mapped_column(Text, nullable=True)
    research_areas: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    keywords: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    funding_type: Mapped[str] = mapped_column(
        String(64), nullable=False, default="grant"
    )
    country: Mapped[str] = mapped_column(String(4), nullable=False, default="US")

    # ── Source URLs ───────────────────────────────────────────────────────────
    source_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    application_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # ── Lifecycle ─────────────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default="active"
    )

    # ── Audit timestamps ──────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )

    # ── Constraints / indexes ─────────────────────────────────────────────────
    __table_args__ = (
        # Primary deduplication constraint
        UniqueConstraint("external_id", "source", name="uq_funding_ext_id_source"),
        # Speed up common search filters
        Index("ix_funding_status", "status"),
        Index("ix_funding_deadline", "deadline"),
        Index("ix_funding_funding_type", "funding_type"),
        Index("ix_funding_country", "country"),
        Index("ix_funding_source", "source"),
    )

    def __repr__(self) -> str:
        return (
            f"<FundingOpportunity id={self.id} source={self.source!r} "
            f"external_id={self.external_id!r} title={self.title[:40]!r}>"
        )
