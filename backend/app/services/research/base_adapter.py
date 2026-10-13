"""
Base Research Adapter Interface and Resilience Framework
Defines standard provider contract, timeout controls, rate limiting, and exponential retry.
"""
from abc import ABC, abstractmethod
import asyncio
import logging
from typing import Optional, List, Dict, Any
import httpx

from app.services.research.schemas import NormalizedPaper, ProviderStatus

logger = logging.getLogger("research.adapters")


class BaseResearchAdapter(ABC):
    def __init__(
        self,
        provider_id: str,
        name: str,
        requires_key: bool = True,
        timeout_seconds: float = 8.0,
        max_retries: int = 2,
    ):
        self.provider_id = provider_id
        self.name = name
        self.requires_key = requires_key
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.last_error: Optional[str] = None
        self._semaphore = asyncio.Semaphore(5)  # Bounded concurrency per provider

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider credentials/prerequisites are available."""
        pass

    @abstractmethod
    async def search(self, query: str, limit: int = 10, **kwargs) -> List[NormalizedPaper]:
        """Execute query search and return normalized papers."""
        pass

    async def get_paper(self, external_id: str) -> Optional[NormalizedPaper]:
        """Fetch individual paper details by provider external ID if supported."""
        return None

    @abstractmethod
    def get_status(self) -> ProviderStatus:
        """Report operational capabilities and health."""
        pass

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        follow_redirects: bool = True,
    ) -> Optional[httpx.Response]:
        """
        Executes HTTP requests with bounded concurrency, configurable timeouts,
        exponential backoff for transient 5xx/network errors, and rate limit honoring.
        """
        async with self._semaphore:
            backoff = 0.5
            for attempt in range(self.max_retries + 1):
                try:
                    async with httpx.AsyncClient(
                        timeout=self.timeout_seconds,
                        follow_redirects=follow_redirects,
                    ) as client:
                        response = await client.request(
                            method=method,
                            url=url,
                            params=params,
                            headers=headers,
                        )

                        # Respect 429 Too Many Requests
                        if response.status_code == 429:
                            retry_after = response.headers.get("Retry-After")
                            wait_time = float(retry_after) if retry_after and retry_after.isdigit() else backoff
                            logger.warning(f"[{self.name}] Rate limit (429). Waiting {wait_time}s")
                            if attempt < self.max_retries:
                                await asyncio.sleep(min(wait_time, 2.0))
                                backoff *= 2
                                continue
                            self.last_error = "Rate limit exceeded (429)"
                            return None

                        # Do not retry 4xx client errors (400, 401, 403, 404)
                        if 400 <= response.status_code < 500:
                            self.last_error = f"Client error ({response.status_code})"
                            logger.warning(f"[{self.name}] HTTP {response.status_code} for {url}")
                            return None

                        # Retry on 5xx server errors
                        if response.status_code >= 500:
                            self.last_error = f"Server error ({response.status_code})"
                            if attempt < self.max_retries:
                                await asyncio.sleep(backoff)
                                backoff *= 2
                                continue
                            return None

                        self.last_error = None
                        return response

                except (httpx.TimeoutException, httpx.NetworkError) as err:
                    self.last_error = f"Network timeout or connectivity error: {str(err)}"
                    logger.warning(f"[{self.name}] Attempt {attempt + 1} failed: {err}")
                    if attempt < self.max_retries:
                        await asyncio.sleep(backoff)
                        backoff *= 2
                        continue
                    return None
                except Exception as err:
                    self.last_error = f"Unexpected error: {str(err)}"
                    logger.error(f"[{self.name}] Unexpected error: {err}", exc_info=True)
                    return None

            return None
