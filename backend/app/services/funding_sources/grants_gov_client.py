"""
Grants.gov API client — Module 4.

grants.gov provides US federal grant opportunities free of charge.
No API key required. Polite usage recommended.

API docs: https://www.grants.gov/web/grants/s2s/grantor/iGrantsWebServices.html
REST search: POST https://apply07.grants.gov/grantsws/rest/opportunities/search
"""
import logging
from typing import Any

import httpx

from app.services.funding_sources.base import BaseFundingSourceClient

logger = logging.getLogger(__name__)

_BASE_URL = "https://apply07.grants.gov/grantsws/rest/opportunities/search"
_DEFAULT_TIMEOUT = 45  # seconds — grants.gov can be slow


class GrantsGovClient(BaseFundingSourceClient):
    """
    HTTP client for the grants.gov Opportunity Search REST API.

    Usage:
        client = GrantsGovClient()
        records = client.search("artificial intelligence", page=1, per_page=25)
    """

    def __init__(self, timeout: int = _DEFAULT_TIMEOUT) -> None:
        self._timeout = timeout

    @property
    def source_name(self) -> str:
        return "grants_gov"

    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
    ) -> list[dict[str, Any]]:
        """
        Search grants.gov for federal funding opportunities.

        Returns raw opportunity dicts on success, [] on error.
        """
        # grants.gov uses 0-based offset
        offset = (page - 1) * per_page

        payload = {
            "keyword": query,
            "oppStatuses": "posted",  # open opportunities only
            "rows": per_page,
            "startRecordNum": offset,
            "sortBy": "openDate|desc",
        }

        try:
            logger.info(
                "grants.gov search | query=%r page=%d per_page=%d",
                query, page, per_page,
            )
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(
                    _BASE_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()

            data = response.json()

            # grants.gov wraps results in "oppHits"
            if not isinstance(data, dict):
                logger.warning("grants.gov returned non-dict response: %s", type(data))
                return []

            hits = data.get("oppHits") or []
            if not isinstance(hits, list):
                logger.warning("grants.gov 'oppHits' not a list: %s", type(hits))
                return []

            logger.info("grants.gov | fetched=%d records (page=%d)", len(hits), page)
            return hits

        except httpx.TimeoutException:
            logger.error("grants.gov timed out after %ds for query=%r", self._timeout, query)
            return []

        except httpx.HTTPStatusError as exc:
            logger.error("grants.gov HTTP %d for query=%r: %s", exc.response.status_code, query, exc)
            return []

        except httpx.RequestError as exc:
            logger.error("grants.gov network error for query=%r: %s", query, exc)
            return []

        except Exception as exc:  # noqa: BLE001
            logger.error("Unexpected error from grants.gov for query=%r: %s", query, exc)
            return []
