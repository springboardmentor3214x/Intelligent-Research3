"""
USPTO Open Data Portal API Client — Module 5.
Endpoint: https://api.uspto.gov/api/v1/patent/applications/search
"""

import logging
from typing import Any, Optional

import httpx

from app.core.config import get_settings
from app.services.patent_sources.base import BasePatentSourceClient

logger = logging.getLogger(__name__)

USPTO_SEARCH_URL = "https://api.uspto.gov/api/v1/patent/applications/search"


class USPTOPatentClient(BasePatentSourceClient):
    """
    Client for the official USPTO Open Data Portal (ODP) API.
    """

    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or getattr(settings, "USPTO_API_KEY", "") or ""
        self.timeout = 15.0

    @property
    def source_name(self) -> str:
        return "uspto"

    def is_configured(self) -> bool:
        return bool(self.api_key.strip())

    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        if not self.is_configured():
            logger.info("USPTO API key is not configured in settings (.env)")
            return []

        start = max(0, (page - 1) * per_page)
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": self.api_key,
        }
        payload = {
            "q": query,
            "start": start,
            "rows": min(per_page, 100),
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(USPTO_SEARCH_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("results", data.get("patents", []))
                elif resp.status_code in (401, 403):
                    logger.warning(f"USPTO API authentication error (status {resp.status_code}): {resp.text[:200]}")
                    return []
                else:
                    logger.warning(f"USPTO API responded with HTTP {resp.status_code}: {resp.text[:200]}")
                    return []
        except Exception as exc:
            logger.error(f"USPTO API request failed: {exc}")
            return []
