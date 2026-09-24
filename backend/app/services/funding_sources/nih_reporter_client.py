"""
backend/app/services/funding_sources/nih_reporter_client.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

NIH RePORTER API connector.
Endpoint: POST https://api.reporter.nih.gov/v2/projects/search
Docs    : https://api.reporter.nih.gov/

License / terms:
  NIH RePORTER data is US federal government data in the public domain.
  No API key is required. Rate limits apply (handled with tenacity retry).

Field mapping (source → raw dict returned by this client):
  appl_id          → external_id
  project_title    → title
  org_name         → organization
  abstract_text    → description
  award_amount     → funding_amount  (USD)
  project_end_date → deadline
  pref_terms       → keywords
  terms            → keywords (fallback)
  project_num      → source_url suffix
  full_study_section.group_code → research_areas (coarse mapping)

The raw dict shape (before normalization):
  {
      "external_id":    str,
      "title":          str,
      "organization":   str,
      "description":    str | None,
      "funding_amount": float | None,
      "currency":       "USD",
      "deadline":       str | None,   # ISO-8601 string from source
      "keywords":       list[str],
      "research_areas": list[str],
      "source_url":     str,
      "application_url":str,
      "funding_type":   "grant",
      "country":        "US",
      "_source":        "nih_reporter",
  }
"""

import logging
from typing import Any

import httpx
from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import get_settings
from app.services.funding_sources.base import FundingSourceClient

logger = logging.getLogger(__name__)
settings = get_settings()

_BASE = settings.nih_reporter_base_url.rstrip("/")
_SEARCH_ENDPOINT = f"{_BASE}/projects/search"
_PROJECT_URL_TEMPLATE = "https://reporter.nih.gov/project-details/{appl_id}"


class NIHReporterClient(FundingSourceClient):
    """
    Connector for the NIH RePORTER v2 Projects Search API.

    Uses POST /v2/projects/search with a text query built from the supplied
    keywords.  Returns raw dicts ready for the normalizer.
    """

    source_id = "nih_reporter"

    # ── Retry decorator (applied to the inner HTTP call) ─────────────────────
    @staticmethod
    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        reraise=True,
    )
    async def _post(client: httpx.AsyncClient, payload: dict) -> dict:
        response = await client.post(
            _SEARCH_ENDPOINT,
            json=payload,
            timeout=settings.funding_sync_timeout_seconds,
        )
        response.raise_for_status()
        return response.json()

    async def fetch(
        self,
        keywords: list[str],
        limit: int = 50,
    ) -> list[dict]:
        """
        Search NIH RePORTER for active grants matching the given keywords.

        Returns a list of raw dicts (see module docstring for shape).
        Returns [] and logs the error if the source is unreachable.
        """
        if not keywords:
            logger.warning("[nih_reporter] fetch() called with empty keywords — skipping.")
            return []

        query_text = " ".join(keywords)
        payload = {
            "criteria": {
                "advanced_text_search": {
                    "operator": "advanced",
                    "search_field": "projecttitle,terms",
                    "search_text": query_text,
                },
                # Only fetch active / recently completed projects
                "project_end_date": {"from_date": "2024-01-01", "to_date": "2027-12-31"},
            },
            "offset": 0,
            "limit": min(limit, 500),  # API hard-cap is 500 per request
            "sort_field": "project_end_date",
            "sort_order": "desc",
        }

        try:
            async with httpx.AsyncClient() as client:
                data = await self._post(client, payload)
        except RetryError as exc:
            self.log_fetch_error(exc, "NIH RePORTER unreachable after retries")
            return []
        except httpx.HTTPStatusError as exc:
            self.log_fetch_error(exc, f"HTTP {exc.response.status_code}")
            return []
        except Exception as exc:  # noqa: BLE001
            self.log_fetch_error(exc, "unexpected error")
            return []

        results: list[dict] = data.get("results", [])
        logger.info(
            "[nih_reporter] Fetched %d raw records for keywords=%r",
            len(results),
            keywords,
        )
        return [self._to_raw_dict(r) for r in results]

    # ── Field extraction helpers ───────────────────────────────────────────────

    def _to_raw_dict(self, record: dict[str, Any]) -> dict:
        """Map a single NIH RePORTER project record to the raw dict shape."""
        appl_id = str(record.get("appl_id", ""))
        project_num = record.get("project_num", appl_id)

        # Keywords: prefer pref_terms (controlled vocabulary), fall back to terms
        pref_terms: str = record.get("pref_terms", "") or ""
        terms: str = record.get("terms", "") or ""
        raw_terms = pref_terms if pref_terms.strip() else terms
        keywords = [
            t.strip()
            for t in raw_terms.replace(";", ",").split(",")
            if t.strip()
        ]

        # Research areas from study section
        study_section = record.get("full_study_section") or {}
        section_name: str = study_section.get("name", "") or ""
        group_code: str = study_section.get("group_code", "") or ""
        research_areas = [x for x in [section_name, group_code] if x]

        # Principal Investigator org
        org: dict = record.get("organization") or {}
        organization = org.get("org_name", "") or ""

        return {
            "external_id": appl_id,
            "title": record.get("project_title", "").strip(),
            "organization": organization.strip(),
            "description": record.get("abstract_text") or None,
            "funding_amount": self._parse_amount(record.get("award_amount")),
            "currency": "USD",
            "deadline": record.get("project_end_date") or None,
            "keywords": keywords,
            "research_areas": research_areas,
            "source_url": _PROJECT_URL_TEMPLATE.format(appl_id=appl_id),
            "application_url": _PROJECT_URL_TEMPLATE.format(appl_id=appl_id),
            "funding_type": "grant",
            "country": "US",
            "_source": self.source_id,
            "_project_num": project_num,
        }

    @staticmethod
    def _parse_amount(raw: Any) -> float | None:
        """Parse award_amount safely — returns None on missing/invalid values."""
        if raw is None:
            return None
        try:
            val = float(raw)
            return val if val > 0 else None
        except (TypeError, ValueError):
            return None
