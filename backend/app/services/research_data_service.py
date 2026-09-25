"""
Research Data Service – Module 6 Technology Intelligence

Primary source: OpenAlex (https://api.openalex.org)
- Free, no API key required (but mailto recommended for higher rate limits)
- Provides: publication counts, years, concepts, institutions

If OpenAlex is unavailable:
- Return cached DB data if present
- Never silently return fake data
- Return status="partial" with explanation

Secondary sources (configured via env):
- Semantic Scholar (for related papers, citations)
- Crossref (bibliographic metadata)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

OPENALEX_BASE = "https://api.openalex.org"
TIMEOUT = 15.0


async def fetch_yearly_research_counts(
    technology_name: str,
    start_year: int = 2019,
    end_year: int = 2025,
) -> dict:
    """
    Fetch per-year publication counts from OpenAlex for a technology/concept.

    Returns:
        {
            "source": "OpenAlex",
            "query": str,
            "status": "success" | "error" | "partial",
            "retrieved_at": str,
            "yearly_counts": {year: count, ...},
            "error": str | None,
        }
    """
    mailto = settings.OPENALEX_MAILTO
    params = {
        "filter": f"title_and_abstract.search:{technology_name}",
        "group_by": "publication_year",
        "per_page": "200",
    }
    if mailto:
        params["mailto"] = mailto

    url = f"{OPENALEX_BASE}/works"
    retrieved_at = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        yearly_counts: dict[int, int] = {}
        for group in data.get("group_by", []):
            try:
                year = int(group["key"])
                count = int(group["count"])
                if start_year <= year <= end_year:
                    yearly_counts[year] = count
            except (ValueError, KeyError):
                continue

        return {
            "source": "OpenAlex",
            "query": technology_name,
            "status": "success",
            "retrieved_at": retrieved_at,
            "yearly_counts": yearly_counts,
            "error": None,
        }

    except httpx.TimeoutException:
        logger.warning("OpenAlex timeout for query: %s", technology_name)
        return _error_response("OpenAlex", technology_name, retrieved_at, "Request timed out")

    except httpx.HTTPStatusError as e:
        logger.warning("OpenAlex HTTP error %s for query: %s", e.response.status_code, technology_name)
        return _error_response("OpenAlex", technology_name, retrieved_at, str(e))

    except Exception as e:
        logger.error("OpenAlex unexpected error: %s", e)
        return _error_response("OpenAlex", technology_name, retrieved_at, str(e))


async def fetch_top_organizations(
    technology_name: str,
    limit: int = 20,
) -> dict:
    """
    Fetch top institutions publishing on a technology from OpenAlex.

    Returns:
        {
            "source": "OpenAlex",
            "status": str,
            "organizations": [{"name": str, "count": int}, ...],
        }
    """
    mailto = settings.OPENALEX_MAILTO
    params = {
        "filter": f"title_and_abstract.search:{technology_name}",
        "group_by": "authorships.institutions.display_name",
        "per_page": str(limit),
    }
    if mailto:
        params["mailto"] = mailto

    url = f"{OPENALEX_BASE}/works"
    retrieved_at = datetime.now(timezone.utc).isoformat()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        orgs = []
        for group in data.get("group_by", [])[:limit]:
            name = group.get("key_display_name") or group.get("key", "Unknown")
            count = int(group.get("count", 0))
            if name and name.lower() not in ("unknown institution", ""):
                orgs.append({"name": name, "count": count})

        return {
            "source": "OpenAlex",
            "status": "success",
            "retrieved_at": retrieved_at,
            "organizations": orgs,
        }

    except Exception as e:
        logger.warning("OpenAlex org fetch failed: %s", e)
        return {
            "source": "OpenAlex",
            "status": "error",
            "retrieved_at": retrieved_at,
            "organizations": [],
            "error": str(e),
        }


def _error_response(source: str, query: str, retrieved_at: str, error: str) -> dict:
    return {
        "source": source,
        "query": query,
        "status": "error",
        "retrieved_at": retrieved_at,
        "yearly_counts": {},
        "error": error,
    }
