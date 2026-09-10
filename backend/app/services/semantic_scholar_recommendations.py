"""
Semantic Scholar Recommendations API client — Module 3.

Uses the Semantic Scholar Recommendations API v1:
  https://api.semanticscholar.org/recommendations/v1

Two modes:
  1. GET  /papers/forpaper/{paper_id}  — given ONE paper, get similar papers
  2. POST /papers/                     — given a list of positive (and optional
                                        negative) paper IDs, get tailored recs

No API key is required for this endpoint.
If SEMANTIC_SCHOLAR_API_KEY is set, it is included to get priority routing.

Official docs:
  https://api.semanticscholar.org/api-docs/recommendations
"""

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.semanticscholar.org/recommendations/v1"
_DEFAULT_TIMEOUT = 30  # seconds
_MAX_RECOMMENDATIONS = 500

# Rich field set — maps directly to BasePaper schema from the swagger spec
_DEFAULT_FIELDS = ",".join([
    "paperId",
    "externalIds",
    "url",
    "title",
    "abstract",
    "venue",
    "publicationVenue",
    "year",
    "referenceCount",
    "citationCount",
    "influentialCitationCount",
    "isOpenAccess",
    "openAccessPdf",
    "fieldsOfStudy",
    "s2FieldsOfStudy",
    "publicationTypes",
    "publicationDate",
    "journal",
    "authors",
])


class SemanticScholarRecommendationsClient:
    """
    Client for the Semantic Scholar Recommendations API v1.

    This endpoint is publicly accessible (no API key required).
    An optional API key is included when available for priority routing.

    Usage:
        client = SemanticScholarRecommendationsClient(api_key="...")

        # Recommend similar papers to ONE known paper:
        papers = client.recommend_for_paper("649def34f8be52c8b66281af98ae884c09aef38b")

        # Recommend papers based on positive/negative examples:
        papers = client.recommend_from_examples(
            positive_ids=["649def34...", "5c5751d4..."],
            negative_ids=["ArXiv:1805.02262"],
            limit=20,
        )
    """

    def __init__(
        self,
        api_key: str | None = None,
        timeout: int = _DEFAULT_TIMEOUT,
    ) -> None:
        self._api_key = api_key
        self._timeout = timeout

    def _headers(self) -> dict[str, str]:
        h: dict[str, str] = {"Accept": "application/json"}
        if self._api_key:
            h["x-api-key"] = self._api_key
        return h

    # ------------------------------------------------------------------
    # GET /papers/forpaper/{paper_id}
    # ------------------------------------------------------------------

    def recommend_for_paper(
        self,
        paper_id: str,
        limit: int = 20,
        pool: str = "recent",
        fields: str = _DEFAULT_FIELDS,
    ) -> list[dict[str, Any]]:
        """
        Get papers similar to a SINGLE input paper.

        Args:
            paper_id: Semantic Scholar paper ID (40-char hex) OR
                      prefixed ID like "ArXiv:2301.00001", "DOI:10.x/y".
            limit:    Number of recommendations to return (max 500).
            pool:     "recent" (default) or "all-cs".
            fields:   Comma-separated field names to return.

        Returns:
            List of raw S2 paper dicts, or [] on failure.
        """
        limit = min(limit, _MAX_RECOMMENDATIONS)
        url = f"{_BASE_URL}/papers/forpaper/{paper_id}"
        params = {"limit": limit, "fields": fields, "from": pool}

        try:
            logger.info(
                "S2 Recommendations | paper_id=%s limit=%d pool=%s",
                paper_id, limit, pool,
            )
            with httpx.Client(timeout=self._timeout) as client:
                r = client.get(url, params=params, headers=self._headers())
                r.raise_for_status()

            data = r.json()
            papers = data.get("recommendedPapers", [])
            logger.info(
                "S2 Recommendations | returned %d papers for paper_id=%s",
                len(papers), paper_id,
            )
            return papers if isinstance(papers, list) else []

        except httpx.HTTPStatusError as exc:
            logger.warning(
                "S2 Recommendations HTTP %d for paper_id=%s: %s",
                exc.response.status_code, paper_id, exc,
            )
            return []
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "S2 Recommendations error for paper_id=%s: %s", paper_id, exc
            )
            return []

    # ------------------------------------------------------------------
    # POST /papers/
    # ------------------------------------------------------------------

    def recommend_from_examples(
        self,
        positive_ids: list[str],
        negative_ids: list[str] | None = None,
        limit: int = 20,
        fields: str = _DEFAULT_FIELDS,
    ) -> list[dict[str, Any]]:
        """
        Get papers recommended based on a list of positive (and optional
        negative) example paper IDs.

        Args:
            positive_ids:  Papers the researcher LIKES / is interested in.
            negative_ids:  Papers the researcher is NOT interested in (optional).
            limit:         Number of recommendations to return (max 500).
            fields:        Comma-separated field names to return.

        Returns:
            List of raw S2 paper dicts, or [] on failure.
        """
        if not positive_ids:
            logger.warning("S2 Recommendations POST: no positive IDs provided")
            return []

        limit = min(limit, _MAX_RECOMMENDATIONS)
        url = f"{_BASE_URL}/papers/"
        params = {"limit": limit, "fields": fields}
        body: dict[str, Any] = {
            "positivePaperIds": positive_ids,
            "negativePaperIds": negative_ids or [],
        }

        try:
            logger.info(
                "S2 Recommendations POST | positive=%d negative=%d limit=%d",
                len(positive_ids), len(negative_ids or []), limit,
            )
            with httpx.Client(timeout=self._timeout) as client:
                r = client.post(
                    url,
                    params=params,
                    json=body,
                    headers={**self._headers(), "Content-Type": "application/json"},
                )
                r.raise_for_status()

            data = r.json()
            papers = data.get("recommendedPapers", [])
            logger.info(
                "S2 Recommendations POST | returned %d papers", len(papers)
            )
            return papers if isinstance(papers, list) else []

        except httpx.HTTPStatusError as exc:
            logger.warning(
                "S2 Recommendations POST HTTP %d: %s",
                exc.response.status_code, exc,
            )
            return []
        except Exception as exc:  # noqa: BLE001
            logger.error("S2 Recommendations POST error: %s", exc)
            return []
