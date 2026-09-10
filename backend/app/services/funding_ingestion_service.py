"""
Funding Ingestion Service — Module 4.

Orchestrates: fetch → normalize → validate → upsert → summarize.
"""
import json
import logging
from datetime import datetime
from typing import Any

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.funding import FundingOpportunity
from app.schemas.funding import FundingOpportunityCreate, FundingSyncSummary
from app.services.funding_sources.base import BaseFundingSourceClient
from app.services.funding_sources.grants_gov_client import GrantsGovClient
from app.services.funding_sources.normalizer import (
    GrantsGovNormalizer,
    make_org_fingerprint,
    make_title_fingerprint,
)

logger = logging.getLogger(__name__)


def _build_orm_kwargs(opp: FundingOpportunityCreate) -> dict[str, Any]:
    """Convert a FundingOpportunityCreate to ORM kwargs."""
    return {
        "external_id": opp.external_id,
        "source": opp.source,
        "title": opp.title,
        "organization": opp.organization,
        "description": opp.description,
        "funding_amount": opp.funding_amount,
        "funding_amount_min": opp.funding_amount_min,
        "funding_amount_max": opp.funding_amount_max,
        "currency": opp.currency,
        "deadline": opp.deadline,
        "status": opp.status,
        "funding_type": opp.funding_type,
        "country": opp.country,
        "research_areas": json.dumps(opp.research_areas),
        "keywords": json.dumps(opp.keywords),
        "eligibility": opp.eligibility,
        "source_url": opp.source_url,
        "application_url": opp.application_url,
        "title_fingerprint": make_title_fingerprint(opp.title),
        "org_fingerprint": make_org_fingerprint(opp.organization),
    }


def _find_existing(
    db: Session, opp: FundingOpportunityCreate
) -> FundingOpportunity | None:
    """Find existing record by (source, external_id) or fingerprint fallback."""
    # 1. Primary: source + external_id
    if opp.external_id:
        existing = (
            db.query(FundingOpportunity)
            .filter(
                FundingOpportunity.source == opp.source,
                FundingOpportunity.external_id == opp.external_id,
            )
            .first()
        )
        if existing:
            return existing

    # 2. Fallback: title + org fingerprint + deadline
    title_fp = make_title_fingerprint(opp.title)
    org_fp = make_org_fingerprint(opp.organization)
    if title_fp:
        q = db.query(FundingOpportunity).filter(
            FundingOpportunity.title_fingerprint == title_fp
        )
        if org_fp:
            q = q.filter(FundingOpportunity.org_fingerprint == org_fp)
        if opp.deadline:
            q = q.filter(FundingOpportunity.deadline == opp.deadline)
        existing = q.first()
        if existing:
            return existing

    return None


def _upsert_opportunity(
    db: Session, opp: FundingOpportunityCreate
) -> tuple[FundingOpportunity, str]:
    """Insert or update a FundingOpportunity. Returns (record, action)."""
    existing = _find_existing(db, opp)
    kwargs = _build_orm_kwargs(opp)

    if existing:
        # Update changed fields (deadline, description, status, amounts)
        kwargs.pop("external_id", None)
        kwargs.pop("source", None)
        kwargs["updated_at"] = datetime.utcnow()
        for field, value in kwargs.items():
            setattr(existing, field, value)
        try:
            db.commit()
            db.refresh(existing)
        except Exception:
            db.rollback()
            raise
        return existing, "updated"

    record = FundingOpportunity(**kwargs)
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        existing = _find_existing(db, opp)
        if existing:
            return existing, "updated"
        raise
    return record, "inserted"


class FundingIngestionService:
    """
    Funding ingestion pipeline:
        source_client.search()
            → normalizer.normalize()
            → validate (Pydantic)
            → upsert
    """

    def __init__(
        self,
        client: BaseFundingSourceClient | None = None,
        normalizer: GrantsGovNormalizer | None = None,
    ) -> None:
        self._client = client or GrantsGovClient()
        self._normalizer = normalizer or GrantsGovNormalizer()

    def run_sync(
        self,
        db: Session,
        query: str,
        page: int = 1,
        per_page: int = 25,
    ) -> FundingSyncSummary:
        """Execute one ingestion cycle. Returns FundingSyncSummary."""
        summary = FundingSyncSummary()

        logger.info(
            "Starting funding sync | source=%s query=%r page=%d per_page=%d",
            self._client.source_name, query, page, per_page,
        )

        raw_records: list[dict[str, Any]] = self._client.search(
            query=query, page=page, per_page=per_page
        )
        summary.fetched = len(raw_records)

        if not raw_records:
            logger.warning("No funding records returned for query=%r", query)
            return summary

        for idx, raw in enumerate(raw_records, start=1):
            try:
                normalized = self._normalizer.normalize(raw)
                if normalized is None:
                    summary.failed += 1
                    continue

                try:
                    validated = FundingOpportunityCreate.model_validate(
                        normalized.model_dump()
                    )
                except ValidationError as exc:
                    logger.warning("Funding record %d/%d failed validation: %s", idx, summary.fetched, exc)
                    summary.failed += 1
                    continue

                _, action = _upsert_opportunity(db, validated)

                if action == "inserted":
                    summary.inserted += 1
                elif action == "updated":
                    summary.updated += 1
                else:
                    summary.skipped_duplicates += 1

            except Exception as exc:  # noqa: BLE001
                logger.error("Error processing funding record %d/%d: %s", idx, summary.fetched, exc, exc_info=True)
                summary.failed += 1
                try:
                    db.rollback()
                except Exception:
                    pass

        logger.info(
            "Funding sync complete | fetched=%d inserted=%d updated=%d skipped=%d failed=%d",
            summary.fetched, summary.inserted, summary.updated, summary.skipped_duplicates, summary.failed,
        )
        return summary
