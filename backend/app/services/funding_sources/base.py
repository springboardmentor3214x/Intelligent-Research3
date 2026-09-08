"""
backend/app/services/funding_sources/base.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Abstract base class for all funding source connectors.
Each concrete connector (NIH, Grants.gov, etc.) extends this class and
implements the `fetch()` method.

Design principle: the ingestion orchestrator only knows about the base class —
adding a new source never requires changes to the orchestrator.
"""

import logging
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class FundingSourceClient(ABC):
    """
    Abstract funding source connector.

    Subclasses must implement:
        source_id   — short string identifier used as the `source` field in DB
        fetch()     — retrieve raw opportunity dicts from the source
    """

    # Override in each subclass, e.g. "nih_reporter" or "grants_gov"
    source_id: str = "unknown"

    @abstractmethod
    async def fetch(
        self,
        keywords: list[str],
        limit: int = 50,
    ) -> list[dict]:
        """
        Fetch funding opportunities matching the given keywords.

        Args:
            keywords: List of search terms to query the source with.
            limit:    Maximum number of raw records to return.

        Returns:
            List of raw dicts from the source — NOT yet normalized.
            The normalizer converts these into FundingOpportunityCreate objects.

        Raises:
            Should NOT raise — catch all source errors internally and return []
            while logging the failure. The orchestrator counts errors from the
            returned list length, not from exceptions.
        """
        ...

    def log_fetch_error(self, exc: Exception, context: str = "") -> None:
        """Centralised error logger so all connectors use the same format."""
        logger.error(
            "[%s] Source fetch error%s: %s: %s",
            self.source_id,
            f" ({context})" if context else "",
            type(exc).__name__,
            exc,
        )
