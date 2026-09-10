"""
SerpApi Google Patents Client — Module 5 Patent Landscape Analysis.

Interacts with SerpApi using:
  - Search:  engine=google_patents
  - Details: engine=google_patents_details

The API key is securely loaded from environment variables and never logged or exposed.
"""

import logging
from typing import Any, Optional

import httpx

from app.core.config import get_settings
from app.services.patent_sources.base import BasePatentSourceClient

logger = logging.getLogger(__name__)

SERPAPI_BASE_URL = "https://serpapi.com/search"


class SerpApiGooglePatentsClient(BasePatentSourceClient):
    """
    Client for SerpApi Google Patents Search and Details engines.
    """

    def __init__(self, api_key: Optional[str] = None):
        if api_key is not None:
            self.api_key = api_key.strip()
        else:
            settings = get_settings()
            self.api_key = (getattr(settings, "SERPAPI_API_KEY", "") or "").strip()
        self.timeout = 20.0

    @property
    def source_name(self) -> str:
        return "google_patents"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """
        Search Google Patents via SerpApi.
        Endpoint: https://serpapi.com/search?engine=google_patents&q=...
        """
        if not self.is_configured():
            logger.warning("SerpApi API key is not configured in settings (.env)")
            return []

        # SerpApi requires num between 10 and 100
        num_items = max(10, min(per_page, 100))

        params = {
            "engine": "google_patents",
            "q": query,
            "page": max(1, page),
            "num": num_items,
            "api_key": self.api_key,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.get(SERPAPI_BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("organic_results", [])
                elif resp.status_code in (401, 403):
                    logger.error("SerpApi authentication failure: invalid or missing API key.")
                    return []
                elif resp.status_code == 429:
                    logger.error("SerpApi rate limit exceeded.")
                    return []
                else:
                    logger.warning(f"SerpApi returned HTTP {resp.status_code}")
                    return []
        except httpx.TimeoutException:
            logger.error("SerpApi Google Patents request timed out.")
            return []
        except Exception as exc:
            logger.error(f"SerpApi request failed: {type(exc).__name__}")
            return []

    def get_details(self, patent_id: str) -> Optional[dict[str, Any]]:
        """
        Fetch rich patent details via SerpApi.
        Endpoint: https://serpapi.com/search?engine=google_patents_details&patent_id=...
        """
        if not self.is_configured() or not patent_id:
            return None

        # Clean patent_id (if full URL or publication number passed)
        clean_id = patent_id.strip()
        if not clean_id.startswith("patent/") and "/" not in clean_id:
            clean_id = f"patent/{clean_id}/en"

        params = {
            "engine": "google_patents_details",
            "patent_id": clean_id,
            "api_key": self.api_key,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.get(SERPAPI_BASE_URL, params=params)
                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code in (401, 403):
                    logger.error("SerpApi authentication failure on patent details.")
                    return None
                else:
                    logger.warning(f"SerpApi details returned HTTP {resp.status_code}")
                    return None
        except httpx.TimeoutException:
            logger.error("SerpApi Google Patents Details request timed out.")
            return None
        except Exception as exc:
            logger.error(f"SerpApi details request failed: {type(exc).__name__}")
            return None
