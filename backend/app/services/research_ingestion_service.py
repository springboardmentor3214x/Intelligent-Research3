"""
Research ingestion service — Module 3.

Orchestrates: fetch → normalize → validate → upsert → summarize.
This is the single entry point for triggering a research sync.
"""

import logging
from typing import Any

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.schemas.research_paper import ResearchPaperCreate, SyncSummary
from app.services.research_paper_repository import upsert_paper
from app.services.research_sources.base import BaseResearchSourceClient
from app.services.research_sources.normalizer import OpenAlexNormalizer
from app.services.research_sources.openalex_client import OpenAlexClient

logger = logging.getLogger(__name__)


class ResearchIngestionService:
    """
    Ingestion pipeline:
        source_client.search()
            → normalizer.normalize()
            → validate (Pydantic)
            → repository.upsert_paper()
    """

    def __init__(
        self,
        client: BaseResearchSourceClient | None = None,
        normalizer: OpenAlexNormalizer | None = None,
    ) -> None:
        self._client = client or OpenAlexClient()
        self._normalizer = normalizer or OpenAlexNormalizer()

    def run_sync(
        self,
        db: Session,
        query: str,
        page: int = 1,
        per_page: int = 25,
    ) -> SyncSummary:
        """
        Execute a full ingestion cycle for ``query``.

        Args:
            db:       SQLAlchemy session.
            query:    Search keyword(s).
            page:     Which page to fetch (1-based).
            per_page: Records per page.

        Returns:
            SyncSummary with counts of fetched/inserted/updated/skipped/failed.
        """
        summary = SyncSummary()

        logger.info(
            "Starting research sync | source=%s query=%r page=%d per_page=%d",
            self._client.source_name, query, page, per_page,
        )

        # ---- Step 1: Fetch raw records from the external API ---------------
        raw_records: list[dict[str, Any]] = self._client.search(
            query=query, page=page, per_page=per_page
        )
        summary.fetched = len(raw_records)
        logger.info("Fetched %d raw records from %s", summary.fetched, self._client.source_name)

        if not raw_records:
            logger.warning(
                "No records returned from %s for query=%r",
                self._client.source_name, query,
            )
            return summary

        # ---- Step 2-6: Normalize → Validate → Upsert ----------------------
        for idx, raw in enumerate(raw_records, start=1):
            try:
                # Step 2: Normalize
                normalized: ResearchPaperCreate | None = self._normalizer.normalize(raw)
                if normalized is None:
                    logger.info(
                        "Record %d/%d skipped — normalization returned None",
                        idx, summary.fetched,
                    )
                    summary.failed += 1
                    continue

                # Step 3: Validate (Pydantic does this; belt-and-suspenders here)
                # Re-create to ensure all validators fire
                try:
                    validated = ResearchPaperCreate.model_validate(normalized.model_dump())
                except ValidationError as exc:
                    logger.warning(
                        "Record %d/%d failed validation: %s", idx, summary.fetched, exc
                    )
                    summary.failed += 1
                    continue

                # Step 4-6: Upsert
                _, action = upsert_paper(db, validated)

                if action == "inserted":
                    summary.inserted += 1
                elif action == "updated":
                    summary.updated += 1
                else:
                    summary.skipped_duplicates += 1

            except Exception as exc:  # noqa: BLE001
                logger.error(
                    "Unexpected error processing record %d/%d: %s",
                    idx, summary.fetched, exc,
                    exc_info=True,
                )
                summary.failed += 1
                # Roll back any partial transaction for this record
                try:
                    db.rollback()
                except Exception:
                    pass

        logger.info(
            "Sync complete | fetched=%d inserted=%d updated=%d "
            "skipped=%d failed=%d",
            summary.fetched,
            summary.inserted,
            summary.updated,
            summary.skipped_duplicates,
            summary.failed,
        )

        return summary
