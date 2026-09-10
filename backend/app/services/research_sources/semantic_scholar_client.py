"""
Semantic Scholar research source client — Module 3.

Semantic Scholar (https://www.semanticscholar.org/) provides a free,
open academic graph with real-time access to ~220M+ papers.

With an API key (SEMANTIC_SCHOLAR_API_KEY):
  - Rate limit increases from 1 req/sec → 10 req/sec
  - Priority routing on their infrastructure
  - Required for production workloads

Without an API key: still works but is rate-limited.

Docs: https://api.semanticscholar.org/api-docs/
"""

import logging
from typing import Any

import httpx

from app.services.research_sources.base import BaseResearchSourceClient

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
_DEFAULT_TIMEOUT = 30  # seconds

# Fields we request from Semantic Scholar
_FIELDS = ",".join([
    "paperId",
    "externalIds",
    "title",
    "abstract",
    "authors",
    "year",
    "publicationDate",
    "venue",
    "publicationVenue",
    "fieldsOfStudy",
    "s2FieldsOfStudy",
    "openAccessPdf",
    "isOpenAccess",
    "url",
    "citationCount",
])


class SemanticScholarClient(BaseResearchSourceClient):
    """
    HTTP client for the Semantic Scholar Paper Search API.

    Usage:
        client = SemanticScholarClient(api_key="your-key")
        records = client.search("machine learning healthcare", page=1, per_page=25)
    """

    def __init__(
        self,
        api_key: str | None = None,
        timeout: int = _DEFAULT_TIMEOUT,
    ) -> None:
        """
        Args:
            api_key: Optional Semantic Scholar API key.
                     Increases rate limits from 1 rps → 10 rps.
            timeout: HTTP request timeout in seconds.
        """
        self._api_key = api_key
        self._timeout = timeout

    @property
    def source_name(self) -> str:
        return "semantic_scholar"

    def _build_headers(self) -> dict[str, str]:
        """Build request headers, adding API key if available."""
        headers: dict[str, str] = {
            "Accept": "application/json",
            "User-Agent": "ResearchFundingPlatform/1.0",
        }
        if self._api_key:
            headers["x-api-key"] = self._api_key
        return headers

    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
    ) -> list[dict[str, Any]]:
        """
        Search Semantic Scholar for research papers matching ``query``.

        Returns a list of raw Semantic Scholar paper dicts on success,
        or [] on any transport / API error so the sync can continue.

        Args:
            query:    Search keywords.
            page:     1-based page number.
            per_page: Number of records per page (max 100 for S2).
        """
        # Semantic Scholar uses offset, not page number
        offset = (page - 1) * per_page
        per_page = min(per_page, 100)  # API cap

        params: dict[str, Any] = {
            "query": query,
            "offset": offset,
            "limit": per_page,
            "fields": _FIELDS,
        }

        try:
            logger.info(
                "Semantic Scholar search | query=%r page=%d per_page=%d offset=%d",
                query, page, per_page, offset,
            )
            with httpx.Client(timeout=self._timeout) as client:
                response = client.get(
                    _BASE_URL,
                    params=params,
                    headers=self._build_headers(),
                )
                response.raise_for_status()

            data = response.json()

            if not isinstance(data, dict) or "data" not in data:
                logger.warning(
                    "Semantic Scholar returned unexpected structure: keys=%s",
                    list(data.keys()) if isinstance(data, dict) else type(data),
                )
                return []

            results = data["data"]
            if not isinstance(results, list):
                logger.warning(
                    "Semantic Scholar 'data' field is not a list: %s", type(results)
                )
                return []

            logger.info(
                "Semantic Scholar search | fetched=%d records (page=%d)",
                len(results), page,
            )
            return results

        except httpx.TimeoutException:
            logger.error(
                "Semantic Scholar request timed out after %ds for query=%r",
                self._timeout, query,
            )
            return []

        except httpx.HTTPStatusError as exc:
            logger.error(
                "Semantic Scholar HTTP error %d for query=%r: %s",
                exc.response.status_code, query, exc,
            )
            return []

        except httpx.RequestError as exc:
            logger.error(
                "Semantic Scholar network error for query=%r: %s",
                query, exc,
            )
            return []

        except Exception as exc:  # noqa: BLE001
            logger.error(
                "Unexpected error fetching from Semantic Scholar for query=%r: %s",
                query, exc,
            )
            return []
