"""
FundingOpportunity and SavedFundingOpportunity models — Module 4.

FundingOpportunity stores ingested funding grants from external sources
(e.g. grants.gov).  SavedFundingOpportunity stores per-user bookmarks.
"""
import json
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FundingOpportunity(Base):
    """
    An ingested funding opportunity from an external source.

    Deduplication:
    - Primary:  unique (source, external_id)
    - Fallback: unique (title_fingerprint, organization_fingerprint, deadline)
    """

    __tablename__ = "funding_opportunities"

    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_funding_source_ext"),
    )

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # ── Source tracking ──────────────────────────────────────────────────────
    external_id: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, index=True, default="grants_gov")

    # ── Core fields ──────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(1000), nullable=False, index=True)
    organization: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Financial ────────────────────────────────────────────────────────────
    funding_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    funding_amount_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    funding_amount_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")

    # ── Deadline / Status ────────────────────────────────────────────────────
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="open", index=True)

    # ── Classification ───────────────────────────────────────────────────────
    funding_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    country: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)

    # ── Research matching fields (stored as JSON arrays) ─────────────────────
    research_areas: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON list
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)          # JSON list
    eligibility: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── URLs ─────────────────────────────────────────────────────────────────
    source_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    application_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # ── Dedup fingerprints ───────────────────────────────────────────────────
    title_fingerprint: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    org_fingerprint: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # ── Helpers ──────────────────────────────────────────────────────────────
    def get_research_areas(self) -> list[str]:
        if not self.research_areas:
            return []
        if isinstance(self.research_areas, list):
            return [str(x) for x in self.research_areas]
        try:
            val = json.loads(self.research_areas)
            return [str(x) for x in val] if isinstance(val, list) else [str(val)]
        except (ValueError, TypeError):
            return [str(self.research_areas)]

    def get_keywords(self) -> list[str]:
        if not self.keywords:
            return []
        if isinstance(self.keywords, list):
            return [str(x) for x in self.keywords]
        try:
            val = json.loads(self.keywords)
            return [str(x) for x in val] if isinstance(val, list) else [str(val)]
        except (ValueError, TypeError):
            return [str(self.keywords)]

    def __repr__(self) -> str:
        return f"<FundingOpportunity id={self.id} title={self.title[:50]!r}>"


class SavedFundingOpportunity(Base):
    """
    Per-user saved funding opportunity — Module 4.

    Users can only see their own saved funding (enforced at repo level).
    """

    __tablename__ = "saved_funding_opportunities"

    __table_args__ = (
        UniqueConstraint("user_id", "funding_id", name="uq_saved_funding_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    funding_id: Mapped[int] = mapped_column(
        ForeignKey("funding_opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    funding: Mapped["FundingOpportunity"] = relationship("FundingOpportunity", lazy="joined")

    def __repr__(self) -> str:
        return f"<SavedFundingOpportunity user_id={self.user_id} funding_id={self.funding_id}>"
