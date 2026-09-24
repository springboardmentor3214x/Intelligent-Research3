"""
backend/app/services/funding_sources/grants_gov_client.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Grants.gov Search API connector.
Endpoint: POST https://apply07.grants.gov/grantsws/rest/opportunities/search
Docs    : https://www.grants.gov/web/grants/s2s/grantor/schemas.html
          https://www.grants.gov/web/grants/applicants/search-grants.html

License / terms:
  Grants.gov is a US government website; data is public domain.
  No API key required.  Rate limits apply; handled with tenacity retry.

Field mapping (source → raw dict returned by this client):
  id              → external_id
  title           → title
  agencyName      → organization
  description     → description  (often short synopsis)
  awardFloor      → funding_amount (USD, minimum award)
  closeDate       → deadline  (MM/DD/YYYY string from API)
  opportunityCategory → funding_type mapping
  eligibilities   → eligibility (joined string)
  cfdaList        → keywords (CFDA program codes/titles)
  oppStatus       → status mapping

Raw dict shape (before normalization):
  {
      "external_id":    str,
      "title":          str,
      "organization":   str,
      "description":    str | None,
      "funding_amount": float | None,
      "currency":       "USD",
      "deadline":       str | None,   # MM/DD/YYYY or None
      "keywords":       list[str],
      "research_areas": list[str],
      "eligibility":    str | None,
      "source_url":     str,
      "application_url":str,
      "funding_type":   str,
      "country":        "US",
      "status":         str,          # 'active' | 'expired' | 'closed'
      "_source":        "grants_gov",
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

_BASE = settings.grants_gov_base_url.rstrip("/")
_SEARCH_ENDPOINT = f"{_BASE}/rest/opportunities/search"
_DETAIL_URL_TEMPLATE = (
    "https://www.grants.gov/web/grants/view-opportunity.html?oppId={opp_id}"
)

# Grants.gov opportunity category → funding_type mapping
_CATEGORY_MAP: dict[str, str] = {
    "D": "grant",          # Discretionary
    "M": "grant",          # Mandatory
    "C": "contract",       # Continuation
    "E": "grant",          # Earmark
    "O": "other",          # Other
}

# oppStatus → status mapping
_STATUS_MAP: dict[str, str] = {
    "posted": "active",
    "forecasted": "active",
    "closed": "closed",
    "archived": "expired",
}


class GrantsGovClient(FundingSourceClient):
    """
    Connector for the Grants.gov Opportunity Search REST API.

    Uses POST /grantsws/rest/opportunities/search with keyword and status
    filters.  Returns raw dicts ready for the normalizer.
    """

    source_id = "grants_gov"

    @staticmethod
    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def _post(client: httpx.AsyncClient, payload: dict) -> dict:
        response = await client.post(
            _SEARCH_ENDPOINT,
            json=payload,
            timeout=settings.funding_sync_timeout_seconds,
            headers={"Content-Type": "application/json"},
        )
        response.raise_for_status()
        return response.json()

    async def fetch(
        self,
        keywords: list[str],
        limit: int = 50,
    ) -> list[dict]:
        """
        Search Grants.gov for active funding opportunities matching keywords.

        Returns list of raw dicts.  Returns [] and logs error on failure.
        """
        if not keywords:
            logger.warning("[grants_gov] fetch() called with empty keywords — skipping.")
            return []

        keyword_str = " ".join(keywords)
        payload = {
            "keyword": keyword_str,
            "oppStatuses": "posted|forecasted",   # active opportunities only
            "rows": min(limit, 100),               # API cap
            "startRecordNum": 0,
            "sortBy": "openDate|desc",
            "eligibilities": "",
            "fundingCategories": "",
            "fundingInstruments": "",
        }

        try:
            async with httpx.AsyncClient() as client:
                data = await self._post(client, payload)
        except RetryError as exc:
            self.log_fetch_error(exc, "Grants.gov unreachable after retries")
            return []
        except httpx.HTTPStatusError as exc:
            self.log_fetch_error(exc, f"HTTP {exc.response.status_code}")
            return []
        except Exception as exc:  # noqa: BLE001
            self.log_fetch_error(exc, "unexpected error")
            return []

        opportunities: list[dict] = data.get("oppHits", [])
        logger.info(
            "[grants_gov] Fetched %d raw records for keywords=%r",
            len(opportunities),
            keywords,
        )
        return [self._to_raw_dict(opp) for opp in opportunities]

    # ── Field extraction helpers ───────────────────────────────────────────────

    def _to_raw_dict(self, record: dict[str, Any]) -> dict:
        """Map a single Grants.gov opportunity record to the raw dict shape."""
        opp_id = str(record.get("id", ""))

        # Keywords from CFDA program codes/names
        cfda_list: list[dict] = record.get("cfdaList", []) or []
        keywords = [
            c.get("programTitle", "")
            for c in cfda_list
            if c.get("programTitle")
        ]

        # Research areas from funding category codes
        funding_cats: str = record.get("fundingCategories", "") or ""
        research_areas = [c.strip() for c in funding_cats.split("|") if c.strip()]

        # Eligibility
        elig_list: list[dict] = record.get("eligibilities", []) or []
        eligibility = (
            ", ".join(e.get("label", "") for e in elig_list if e.get("label"))
            or None
        )

        # Status
        raw_status: str = (record.get("oppStatus") or "posted").lower()
        status = _STATUS_MAP.get(raw_status, "active")

        # Funding type
        category_code: str = (record.get("opportunityCategory") or "D").upper()
        funding_type = _CATEGORY_MAP.get(category_code, "other")

        return {
            "external_id": opp_id,
            "title": (record.get("title") or "").strip(),
            "organization": (record.get("agencyName") or "").strip(),
            "description": record.get("description") or None,
            "funding_amount": self._parse_amount(record.get("awardFloor")),
            "currency": "USD",
            "deadline": record.get("closeDate") or None,  # MM/DD/YYYY string
            "keywords": keywords,
            "research_areas": research_areas,
            "eligibility": eligibility,
            "source_url": _DETAIL_URL_TEMPLATE.format(opp_id=opp_id),
            "application_url": (
                record.get("additionalInformationUrl")
                or _DETAIL_URL_TEMPLATE.format(opp_id=opp_id)
            ),
            "funding_type": funding_type,
            "country": "US",
            "status": status,
            "_source": self.source_id,
        }

    @staticmethod
    def _parse_amount(raw: Any) -> float | None:
        """Parse award floor/ceiling safely."""
        if raw is None:
            return None
        try:
            val = float(str(raw).replace(",", ""))
            return val if val > 0 else None
        except (TypeError, ValueError):
            return None
