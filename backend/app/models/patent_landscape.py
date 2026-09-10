"""
PatentRecord model — Module 5 Patent Landscape Analysis.

Stores patents ingested from external patent data providers (e.g. PatentsView/USPTO).

IMPORTANT: This is a standalone intelligence table and is completely separate from
the user-profile `patents` table (Module 2) in research_profiles.  Do NOT confuse
the two.  This table is for global patent intelligence, not user-owned records.

Deduplication strategy:
  - Primary:  unique constraint on (source, source_patent_id)
  - Secondary: unique constraint on patent_number (when present)
  - Fallback: title_fingerprint + assignee_fingerprint + filing_year
"""
import json
import re
from datetime import date, datetime

from sqlalchemy import (
    Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


# ---------------------------------------------------------------------------
# IPC class → human-readable technology domain mapping
# Based on WIPO IPC classification sections
# ---------------------------------------------------------------------------
_IPC_DOMAIN_MAP: dict[str, str] = {
    "A": "Human Necessities",
    "B": "Performing Operations & Transport",
    "C": "Chemistry & Metallurgy",
    "D": "Textiles & Paper",
    "E": "Fixed Constructions",
    "F": "Mechanical Engineering",
    "G": "Physics & Computing",
    "H": "Electricity & Electronics",
    # Common sub-class overrides for more meaningful labels
    "G06": "Computing & AI",
    "G06N": "Artificial Intelligence & Machine Learning",
    "G06F": "Computing Systems & Software",
    "G06T": "Computer Vision & Image Processing",
    "G06Q": "Business & Commerce Systems",
    "G16H": "Healthcare Informatics",
    "G16B": "Bioinformatics & Computational Biology",
    "H04": "Telecommunications & Networking",
    "H04L": "Data Transmission & Networks",
    "H04W": "Wireless Communications",
    "H01": "Basic Electronic Components",
    "H01M": "Power Generation & Storage",
    "H02": "Power Generation & Storage",
    "C12": "Biotechnology & Biochemistry",
    "C07": "Organic Chemistry & Pharmaceuticals",
    "A61": "Medical & Healthcare Devices",
    "B60": "Vehicles & Transportation",
    "B64": "Aviation & Aerospace",
    "G01": "Measurement & Testing",
    "F03": "Energy Machines & Motors",
    "F28": "Heat Exchange",
}


def ipc_to_domain(ipc_code: str | None) -> str:
    """
    Map an IPC classification code to a human-readable technology domain.

    Tries progressively shorter prefixes:
      G06N3 → G06N → G06 → G → 'Computing & AI'

    Returns 'General Technology' when no match is found.
    """
    if not ipc_code:
        return "General Technology"

    code = ipc_code.strip().upper()
    # Try progressively shorter prefixes (4-char, 3-char, 1-char)
    for length in (4, 3, 1):
        prefix = code[:length]
        if prefix in _IPC_DOMAIN_MAP:
            return _IPC_DOMAIN_MAP[prefix]

    return "General Technology"


def _normalize_text(text: str | None) -> str:
    """Return lowercase alphanumeric-only version for fingerprinting."""
    if not text:
        return ""
    return re.sub(r"[^a-z0-9]", "", text.lower())


class PatentRecord(Base):
    """
    An ingested patent record from an external provider (e.g. PatentsView/USPTO).

    Fields align with the Module 5 spec while reusing established ORM patterns.
    """

    __tablename__ = "patent_records"

    __table_args__ = (
        UniqueConstraint("source", "source_patent_id", name="uq_patent_source_ext"),
        UniqueConstraint("patent_number", name="uq_patent_number"),
    )

    # ── Primary key ──────────────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # ── Source tracking ──────────────────────────────────────────────────────
    source: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True, default="patentsview"
    )
    source_patent_id: Mapped[str | None] = mapped_column(
        String(500), nullable=True, index=True
    )

    # ── Core identifiers ─────────────────────────────────────────────────────
    patent_number: Mapped[str | None] = mapped_column(
        String(200), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(2000), nullable=False, index=True)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Assignee / Inventors ─────────────────────────────────────────────────
    assignee: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    assignee_normalized: Mapped[str | None] = mapped_column(
        String(500), nullable=True, index=True
    )
    inventors: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list

    # ── Dates ────────────────────────────────────────────────────────────────
    filing_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    grant_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    filing_year: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)

    # ── Geography ────────────────────────────────────────────────────────────
    country: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)

    # ── Classification ───────────────────────────────────────────────────────
    patent_classification: Mapped[str | None] = mapped_column(
        String(500), nullable=True, index=True
    )  # Primary IPC/CPC code e.g. "G06N3/04"
    all_classifications: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON list of all IPC/CPC codes
    technology_domain: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )  # Derived from IPC e.g. "Artificial Intelligence & Machine Learning"

    # ── Keywords ─────────────────────────────────────────────────────────────
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list

    # ── Citation metrics ─────────────────────────────────────────────────────
    citation_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Full text (optional — only if provider + licensing permits) ──────────
    claims_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── URLs ─────────────────────────────────────────────────────────────────
    source_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # ── Raw metadata cache ───────────────────────────────────────────────────
    raw_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON

    # ── Deduplication fingerprints ───────────────────────────────────────────
    title_fingerprint: Mapped[str | None] = mapped_column(
        String(500), nullable=True, index=True
    )
    assignee_fingerprint: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )

    # ── Clustering cache ─────────────────────────────────────────────────────
    cluster_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    cluster_label: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # ── JSON helpers ─────────────────────────────────────────────────────────

    def get_inventors(self) -> list[str]:
        """Return inventors as a list, falling back to empty list."""
        if not self.inventors:
            return []
        try:
            return json.loads(self.inventors)
        except (ValueError, TypeError):
            return []

    def get_keywords(self) -> list[str]:
        if not self.keywords:
            return []
        try:
            return json.loads(self.keywords)
        except (ValueError, TypeError):
            return []

    def get_all_classifications(self) -> list[str]:
        if not self.all_classifications:
            return []
        try:
            return json.loads(self.all_classifications)
        except (ValueError, TypeError):
            return []

    def get_raw_metadata(self) -> dict:
        if not self.raw_metadata:
            return {}
        try:
            return json.loads(self.raw_metadata)
        except (ValueError, TypeError):
            return {}

    def derive_domain(self) -> str:
        """Return the technology domain derived from primary IPC classification."""
        return ipc_to_domain(self.patent_classification)

    def __repr__(self) -> str:
        return f"<PatentRecord id={self.id} number={self.patent_number!r} title={self.title[:50]!r}>"
