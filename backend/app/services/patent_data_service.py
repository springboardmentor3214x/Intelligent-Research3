"""
Patent Data Service – Module 6 Technology Intelligence

Primary source: PatentsView API (https://api.patentsview.org)
- Free public API, no key required for basic queries
- Provides: patent counts by year, assignees

Fallback: Estimated from research data (patent:research ratio heuristic)
when PatentsView is unavailable.

NOTE: Do NOT pretend Google Patents is a general public API.
API keys (if any) are stored in env vars only.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

PATENTSVIEW_BASE = "https://api.patentsview.org"
TIMEOUT = 20.0


async def fetch_yearly_patent_counts(
    technology_name: str,
    start_year: int = 2019,
    end_year: int = 2025,
) -> dict:
    """
    Fetch per-year patent counts from PatentsView.

    PatentsView query: search patent titles/abstracts for technology keywords.

    Returns:
        {
            "source": "PatentsView",
            "status": "success" | "error" | "partial",
            "yearly_counts": {year: count, ...},
            "error": str | None,
        }
    """
    retrieved_at = datetime.now(timezone.utc).isoformat()

    # Build a per-year query by iterating years
    # PatentsView allows filtering by patent_date range
    api_url = settings.PATENTSVIEW_API_URL or settings.PATENT_API_URL or "https://api.patentsview.org/patents/query"
    api_key = settings.PATENTSVIEW_API_KEY
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-Api-Key"] = api_key

    yearly_counts: dict[int, int] = {}
    errors = []

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
            for year in range(start_year, end_year + 1):
                query = {
                    "q": {
                        "_and": [
                            {"_text_any": {"patent_title": technology_name}},
                            {"_gte": {"patent_date": f"{year}-01-01"}},
                            {"_lte": {"patent_date": f"{year}-12-31"}},
                        ]
                    },
                    "f": ["patent_id"],
                    "o": {"per_page": 1},
                    "s": [{"patent_date": "asc"}],
                }

                try:
                    resp = await client.post(
                        api_url,
                        json=query,
                        headers=headers,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        total = data.get("total_patent_count", 0)
                        yearly_counts[year] = int(total)
                    elif resp.status_code in (301, 302, 307, 308):
                        errors.append(f"PatentsView legacy endpoint discontinued by USPTO (HTTP {resp.status_code} -> Open Data Portal migration)")
                        break
                    elif resp.status_code in (401, 403):
                        errors.append(f"PatentsView authentication required (HTTP {resp.status_code}); set PATENTSVIEW_API_KEY in .env")
                        break
                    else:
                        errors.append(f"Year {year}: HTTP {resp.status_code}")
                except Exception as e:
                    errors.append(f"Year {year}: {str(e)}")

        status = "success" if (not errors and yearly_counts) else ("partial" if yearly_counts else "unavailable")
        return {
            "source": "PatentsView",
            "query": technology_name,
            "status": status,
            "retrieved_at": retrieved_at,
            "yearly_counts": yearly_counts,
            "error": "; ".join(errors) if errors else None,
        }

    except Exception as e:
        logger.error("PatentsView unexpected error: %s", e)
        return {
            "source": "PatentsView",
            "query": technology_name,
            "status": "error",
            "retrieved_at": retrieved_at,
            "yearly_counts": {},
            "error": str(e),
        }


def estimate_patents_from_research(
    yearly_research: dict[int, int],
    ratio: float = 0.15,
) -> dict[int, int]:
    """
    Fallback: Estimate patent counts as a fraction of research counts.
    Used only when PatentsView is unavailable.
    Clearly marked as estimated.
    ratio = 0.15 means ~15 patents per 100 papers (conservative estimate).
    """
    return {year: max(1, int(count * ratio)) for year, count in yearly_research.items()}
