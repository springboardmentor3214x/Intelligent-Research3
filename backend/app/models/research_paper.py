"""
ResearchPaper model — Module 3 Research Data Ingestion.

Stores papers ingested from external research APIs (e.g. OpenAlex).
This is a standalone table and does NOT replace or modify the existing
Publication/Patent models which belong to user research profiles.
"""

import json
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ResearchPaper(Base):
    """
    Ingested research paper from an external source (e.g. OpenAlex).

    Duplicate prevention:
    - Primary:  unique constraint on normalized_doi (when doi is present)
    - Fallback: unique constraint on (source, external_id)
    - Secondary fallback: title_fingerprint + first_author_fingerprint + publication_year
    """

    __tablename__ = "research_papers"

    __table_args__ = (
        UniqueConstraint("normalized_doi", name="uq_research_paper_doi"),
        UniqueConstraint("source", "external_id", name="uq_research_paper_source_ext"),
    )

    # ------------------------------------------------------------------ #
    # Primary key
    # ------------------------------------------------------------------ #
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # ------------------------------------------------------------------ #
    # Source tracking
    # ------------------------------------------------------------------ #
    external_id: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, index=True, default="openalex")

    # ------------------------------------------------------------------ #
    # Core bibliographic fields
    # ------------------------------------------------------------------ #
    title: Mapped[str] = mapped_column(String(1000), nullable=False, index=True)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)
    doi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    normalized_doi: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)

    # ------------------------------------------------------------------ #
    # Authors — stored as JSON array text e.g. '["Alice", "Bob"]'
    # ------------------------------------------------------------------ #
    authors: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list

    # ------------------------------------------------------------------ #
    # Publication date
    # ------------------------------------------------------------------ #
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    publication_year: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    # ------------------------------------------------------------------ #
    # Journal / venue
    # ------------------------------------------------------------------ #
    journal: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ------------------------------------------------------------------ #
    # Keywords / research areas — stored as JSON array text
    # ------------------------------------------------------------------ #
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)      # JSON list
    research_area: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list

    # ------------------------------------------------------------------ #
    # URLs
    # ------------------------------------------------------------------ #
    source_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    open_access_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # ------------------------------------------------------------------ #
    # Duplicate-detection fingerprints
    # ------------------------------------------------------------------ #
    title_fingerprint: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    first_author_fingerprint: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)

    # ------------------------------------------------------------------ #
    # Timestamps
    # ------------------------------------------------------------------ #
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # ------------------------------------------------------------------ #
    # Helpers to de/serialize JSON list columns
    # ------------------------------------------------------------------ #
    def get_authors(self) -> list[str]:
        """Return the authors list, falling back to an empty list."""
        if not self.authors:
            return []
        try:
            return json.loads(self.authors)
        except (ValueError, TypeError):
            return []

    def get_keywords(self) -> list[str]:
        if not self.keywords:
            return []
        try:
            return json.loads(self.keywords)
        except (ValueError, TypeError):
            return []

    def get_research_area(self) -> list[str]:
        if not self.research_area:
            return []
        try:
            return json.loads(self.research_area)
        except (ValueError, TypeError):
            return []

    def __repr__(self) -> str:
        return f"<ResearchPaper id={self.id} title={self.title[:50]!r}>"
