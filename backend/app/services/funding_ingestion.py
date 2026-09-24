"""
backend/app/services/funding_ingestion.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Ingestion orchestrator — ties together source clients, the normalizer, and
the database layer.

Responsibilities:
  - Drive each registered source connector
  - Pass raw records through the normalizer
  - Check for existing duplicates (external_id + source)
    Fallback deduplication: title + organization + deadline date
  - INSERT new records
  - UPDATE changed fields on existing records (deadline, description,
    funding_amount, status, keywords, research_areas)
  - Log every skip / error with enough context to diagnose issues
  - Return an IngestionSummary so the CLI job can print a report

This module does NOT contain any HTTP calls — it only calls source clients
and the normalizer, then writes to the DB.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.funding import FundingOpportunity
from app.schemas.funding import FundingOpportunityCreate, IngestionSummary
from app.services.funding_sources.base import FundingSourceClient
from app.services.funding_sources.normalizer import normalize_opportunity

logger = logging.getLogger(__name__)


# Fields the sync job will UPDATE on an existing record when the source changes
_UPDATABLE_FIELDS = (
    "title",
    "description",
    "funding_amount",
    "currency",
    "deadline",
    "eligibility",
    "research_areas",
    "keywords",
    "status",
    "source_url",
    "application_url",
)


async def run_ingestion(
    db: Session,
    source_client: FundingSourceClient,
    keywords: list[str],
    limit: int = 50,
) -> IngestionSummary:
    """
    Execute a full fetch → normalize → upsert cycle for one source client.

    Args:
        db:            SQLAlchemy session (caller owns commit / rollback).
        source_client: Concrete connector (NIH, Grants.gov, …).
        keywords:      Search terms passed to the source connector.
        limit:         Maximum records to fetch from the source.

    Returns:
        IngestionSummary with counts and any error messages.
    """
    summary = IngestionSummary(source=source_client.source_id)

    # ── 1. Fetch raw records from source ──────────────────────────────────────
    logger.info(
        "[ingestion][%s] Starting fetch — keywords=%r limit=%d",
        source_client.source_id,
        keywords,
        limit,
    )
    raw_records = await source_client.fetch(keywords=keywords, limit=limit)
    summary.fetched = len(raw_records)
    logger.info(
        "[ingestion][%s] Fetched %d raw records.",
        source_client.source_id,
        summary.fetched,
    )

    # ── 2. Normalize + upsert each record ─────────────────────────────────────
    for raw in raw_records:
        normalized = normalize_opportunity(raw, source_client.source_id)

        if normalized is None:
            summary.skipped_malformed += 1
            logger.warning(
                "[ingestion][%s] Skipped malformed record: external_id=%r",
                source_client.source_id,
                raw.get("external_id"),
            )
            continue

        result = _upsert_record(db, normalized)

        if result == "inserted":
            summary.inserted += 1
        elif result == "updated":
            summary.updated += 1
        elif result == "duplicate":
            summary.skipped_duplicates += 1

    # ── 3. Commit all changes for this source ─────────────────────────────────
    try:
        db.commit()
        logger.info(
            "[ingestion][%s] Committed — inserted=%d updated=%d "
            "skipped_duplicates=%d skipped_malformed=%d",
            source_client.source_id,
            summary.inserted,
            summary.updated,
            summary.skipped_duplicates,
            summary.skipped_malformed,
        )
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        msg = f"DB commit failed: {type(exc).__name__}: {exc}"
        summary.errors.append(msg)
        logger.error("[ingestion][%s] %s", source_client.source_id, msg)

    return summary


def _upsert_record(
    db: Session,
    data: FundingOpportunityCreate,
) -> str:
    """
    Insert or update a single FundingOpportunity record.

    Deduplication strategy (in order):
      1. PRIMARY: external_id + source  (preferred — always unique per source)
      2. FALLBACK: title + organization + deadline_date  (when external_id is
         unreliable or empty across sources)

    Returns:
        "inserted"  — new record created
        "updated"   — existing record changed
        "duplicate" — record already up-to-date; no write needed
    """
    existing = _find_existing(db, data)

    if existing is None:
        # ── Insert new record ─────────────────────────────────────────────────
        new_record = FundingOpportunity(**data.model_dump())
        db.add(new_record)
        logger.debug(
            "[ingestion] INSERT external_id=%r source=%r title=%r",
            data.external_id,
            data.source,
            data.title[:60],
        )
        return "inserted"

    # ── Check if anything actually changed ────────────────────────────────────
    changed = False
    for field in _UPDATABLE_FIELDS:
        new_val = getattr(data, field, None)
        old_val = getattr(existing, field, None)
        if new_val != old_val and new_val is not None:
            setattr(existing, field, new_val)
            changed = True

    if changed:
        existing.updated_at = datetime.now(timezone.utc)
        logger.debug(
            "[ingestion] UPDATE external_id=%r source=%r",
            data.external_id,
            data.source,
        )
        return "updated"

    logger.debug(
        "[ingestion] DUPLICATE (no changes) external_id=%r source=%r",
        data.external_id,
        data.source,
    )
    return "duplicate"


def _find_existing(
    db: Session,
    data: FundingOpportunityCreate,
) -> FundingOpportunity | None:
    """
    Look up an existing record using the primary deduplication key
    (external_id + source), then fall back to title + organization + deadline.
    """
    # ── Primary key lookup ────────────────────────────────────────────────────
    stmt = select(FundingOpportunity).where(
        and_(
            FundingOpportunity.external_id == data.external_id,
            FundingOpportunity.source == data.source,
        )
    )
    record = db.scalars(stmt).first()
    if record:
        return record

    # ── Fallback deduplication (title + org + deadline date) ─────────────────
    if not data.title or not data.organization:
        return None

    # Compare only the date portion of the deadline to allow time-zone drift
    deadline_date = data.deadline.date() if data.deadline else None

    stmt_fallback = select(FundingOpportunity).where(
        and_(
            FundingOpportunity.title == data.title,
            FundingOpportunity.organization == data.organization,
            FundingOpportunity.source == data.source,
        )
    )
    candidates = db.scalars(stmt_fallback).all()

    for candidate in candidates:
        cand_date = candidate.deadline.date() if candidate.deadline else None
        if cand_date == deadline_date:
            logger.debug(
                "[ingestion] Fallback dedup matched: title=%r org=%r deadline=%r",
                data.title[:40],
                data.organization[:40],
                deadline_date,
            )
            return candidate

    return None
