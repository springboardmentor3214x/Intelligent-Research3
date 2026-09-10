"""
The Lens Patent API Client — Module 5.
Endpoint: https://api.lens.org/patent/search
"""

import logging
from typing import Any, Optional

import httpx

from app.core.config import get_settings
from app.services.patent_sources.base import BasePatentSourceClient

logger = logging.getLogger(__name__)

LENS_SEARCH_URL = "https://api.lens.org/patent/search"


class LensPatentClient(BasePatentSourceClient):
    """
    Client for The Lens Patent API.
    """

    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or getattr(settings, "LENS_API_KEY", "") or ""
        self.timeout = 15.0

    @property
    def source_name(self) -> str:
        return "lens"

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
            logger.info("The Lens API key is not configured in settings (.env)")
            return []

        offset = max(0, (page - 1) * per_page)
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key.strip()}",
        }
        payload = {
            "query": {
                "match": {
                    "title": query
                }
            },
            "size": min(per_page, 50),
            "from": offset,
            "sort": [{"date_published": "desc"}]
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(LENS_SEARCH_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("data", [])
                else:
                    logger.warning(f"Lens API responded with HTTP {resp.status_code}: {resp.text[:200]}")
                    return []
        except Exception as exc:
            logger.error(f"Lens API request failed: {exc}")
            return []
