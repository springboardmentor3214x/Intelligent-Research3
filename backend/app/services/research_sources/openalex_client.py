"""
OpenAlex research source client — Module 3.

OpenAlex is a free, open, and legally usable research-paper index
maintained by OurResearch (https://openalex.org).
No API key is required. A polite pool e-mail is recommended but optional.

Docs: https://docs.openalex.org
"""

import logging
from typing import Any

import httpx

from app.services.research_sources.base import BaseResearchSourceClient

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.openalex.org/works"
_DEFAULT_TIMEOUT = 30  # seconds


class OpenAlexClient(BaseResearchSourceClient):
    """
    HTTP client for the OpenAlex Works API.

    Usage:
        client = OpenAlexClient(mailto="your@email.com")
        records = client.search("machine learning healthcare", page=1, per_page=25)
    """

    def __init__(self, mailto: str | None = None, timeout: int = _DEFAULT_TIMEOUT) -> None:
        """
        Args:
            mailto:  Optional e-mail for OpenAlex polite pool (recommended).
                     Never included in logs.
            timeout: HTTP request timeout in seconds.
        """
        self._mailto = mailto
        self._timeout = timeout

    @property
    def source_name(self) -> str:
        return "openalex"

    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
    ) -> list[dict[str, Any]]:
        """
        Search OpenAlex for research papers matching ``query``.

        Returns a list of raw OpenAlex work dicts on success,
        or [] on any transport / API error so the sync can continue.
        """
        params: dict[str, Any] = {
            "search": query,
            "page": page,
            "per-page": per_page,
            "select": (
                "id,doi,title,abstract_inverted_index,"
                "authorships,publication_date,publication_year,"
                "primary_location,keywords,concepts,"
                "open_access,best_oa_location"
            ),
        }
        if self._mailto:
            params["mailto"] = self._mailto

        try:
            logger.info(
                "OpenAlex search | query=%r page=%d per_page=%d",
                query, page, per_page,
            )
            with httpx.Client(timeout=self._timeout) as client:
                response = client.get(_BASE_URL, params=params)
                response.raise_for_status()

            data = response.json()

            if not isinstance(data, dict) or "results" not in data:
                logger.warning(
                    "OpenAlex returned unexpected response structure: keys=%s",
                    list(data.keys()) if isinstance(data, dict) else type(data),
                )
                return []

            results = data["results"]
            if not isinstance(results, list):
                logger.warning("OpenAlex 'results' field is not a list: %s", type(results))
                return []

            logger.info(
                "OpenAlex search | fetched=%d records (page=%d)",
                len(results), page,
            )
            return results

        except httpx.TimeoutException:
            logger.error(
                "OpenAlex request timed out after %ds for query=%r page=%d",
                self._timeout, query, page,
            )
            return []

        except httpx.HTTPStatusError as exc:
            logger.error(
                "OpenAlex HTTP error %d for query=%r: %s",
                exc.response.status_code, query, exc,
            )
            return []

        except httpx.RequestError as exc:
            logger.error(
                "OpenAlex network error for query=%r: %s",
                query, exc,
            )
            return []

        except Exception as exc:  # noqa: BLE001
            logger.error(
                "Unexpected error fetching from OpenAlex for query=%r: %s",
                query, exc,
            )
            return []
