"""
Research paper repository — Module 3.

Database CRUD operations for ResearchPaper.
All DB logic is isolated here — no HTTP/API calls in this module.
"""

import json
import logging
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.research_paper import ResearchPaper
from app.schemas.research_paper import ResearchPaperCreate
from app.services.research_sources.normalizer import (
    make_author_fingerprint,
    make_title_fingerprint,
    normalize_doi,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lookup helpers
# ---------------------------------------------------------------------------


def find_by_normalized_doi(db: Session, norm_doi: str) -> ResearchPaper | None:
    """Return a paper whose normalized_doi matches, or None."""
    return (
        db.query(ResearchPaper)
        .filter(ResearchPaper.normalized_doi == norm_doi)
        .first()
    )


def find_by_source_external_id(
    db: Session, source: str, external_id: str
) -> ResearchPaper | None:
    """Return a paper matching (source, external_id), or None."""
    return (
        db.query(ResearchPaper)
        .filter(
            ResearchPaper.source == source,
            ResearchPaper.external_id == external_id,
        )
        .first()
    )


def find_by_fingerprint(
    db: Session,
    title_fp: str,
    author_fp: str | None,
    publication_year: int | None,
) -> ResearchPaper | None:
    """
    Fallback duplicate lookup by title fingerprint + optional author + year.
    Used when a record has no DOI and no external_id.
    """
    q = db.query(ResearchPaper).filter(
        ResearchPaper.title_fingerprint == title_fp
    )
    if author_fp:
        q = q.filter(ResearchPaper.first_author_fingerprint == author_fp)
    if publication_year:
        q = q.filter(ResearchPaper.publication_year == publication_year)
    return q.first()


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------


def _build_orm_kwargs(paper: ResearchPaperCreate) -> dict[str, Any]:
    """Convert a ResearchPaperCreate schema into kwargs for the ORM model."""
    norm_doi = normalize_doi(paper.doi)
    title_fp = make_title_fingerprint(paper.title)
    author_fp = make_author_fingerprint(paper.authors)
    return {
        "external_id": paper.external_id,
        "source": paper.source,
        "title": paper.title,
        "abstract": paper.abstract,
        "doi": paper.doi,
        "normalized_doi": norm_doi,
        "authors": json.dumps(paper.authors),
        "publication_date": paper.publication_date,
        "publication_year": paper.publication_year,
        "journal": paper.journal,
        "keywords": json.dumps(paper.keywords),
        "research_area": json.dumps(paper.research_area),
        "source_url": paper.source_url,
        "open_access_url": paper.open_access_url,
        "title_fingerprint": title_fp,
        "first_author_fingerprint": author_fp,
    }


def insert_paper(db: Session, paper: ResearchPaperCreate) -> ResearchPaper:
    """Insert a new ResearchPaper row and return it."""
    kwargs = _build_orm_kwargs(paper)
    record = ResearchPaper(**kwargs)
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Inserted ResearchPaper id=%d title=%r", record.id, record.title[:60])
    return record


def update_paper(
    db: Session, existing: ResearchPaper, paper: ResearchPaperCreate
) -> ResearchPaper:
    """Update an existing ResearchPaper with fresh data from the source."""
    kwargs = _build_orm_kwargs(paper)
    # Never overwrite the primary key or created_at
    kwargs.pop("external_id", None)
    kwargs.pop("source", None)
    kwargs["updated_at"] = datetime.utcnow()

    for field, value in kwargs.items():
        setattr(existing, field, value)

    db.commit()
    db.refresh(existing)
    logger.info("Updated ResearchPaper id=%d title=%r", existing.id, existing.title[:60])
    return existing


# ---------------------------------------------------------------------------
# Upsert (the main entry point for the sync service)
# ---------------------------------------------------------------------------


def upsert_paper(
    db: Session, paper: ResearchPaperCreate
) -> tuple[ResearchPaper, str]:
    """
    Insert or update a ResearchPaper.

    Returns:
        (record, action) where action is "inserted", "updated", or "skipped".
    """
    norm_doi = normalize_doi(paper.doi)

    # 1. Try to find by DOI first (most reliable)
    if norm_doi:
        existing = find_by_normalized_doi(db, norm_doi)
        if existing:
            update_paper(db, existing, paper)
            return existing, "updated"

    # 2. Try to find by (source, external_id)
    if paper.external_id:
        existing = find_by_source_external_id(db, paper.source, paper.external_id)
        if existing:
            update_paper(db, existing, paper)
            return existing, "updated"

    # 3. Fallback: title + author + year fingerprint
    title_fp = make_title_fingerprint(paper.title)
    author_fp = make_author_fingerprint(paper.authors)
    if title_fp:
        existing = find_by_fingerprint(db, title_fp, author_fp, paper.publication_year)
        if existing:
            update_paper(db, existing, paper)
            return existing, "updated"

    # 4. No duplicate found — insert
    record = insert_paper(db, paper)
    return record, "inserted"
