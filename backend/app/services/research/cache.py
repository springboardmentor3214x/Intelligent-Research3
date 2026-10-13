"""
In-Memory Async TTL Cache for Research API Responses
Avoids redundant third-party API calls, respects rate limits, and accelerates response times.
"""
import time
import asyncio
from typing import Any, Optional, Dict, Tuple


class ResearchCache:
    def __init__(self, default_ttl_seconds: int = 600, max_entries: int = 1000):
        self.default_ttl = default_ttl_seconds
        self.max_entries = max_entries
        self._store: Dict[str, Tuple[Any, float]] = {}  # key -> (value, expiry_timestamp)
        self._lock = asyncio.Lock()
        self.hits = 0
        self.misses = 0

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            if key not in self._store:
                self.misses += 1
                return None
            val, expiry = self._store[key]
            if time.time() > expiry:
                del self._store[key]
                self.misses += 1
                return None
            self.hits += 1
            return val

    async def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        async with self._lock:
            # Enforce max size with simple pruning of expired/old items
            if len(self._store) >= self.max_entries:
                self._prune_expired()
                if len(self._store) >= self.max_entries:
                    # Remove the oldest 10%
                    keys_to_remove = list(self._store.keys())[: max(1, self.max_entries // 10)]
                    for k in keys_to_remove:
                        self._store.pop(k, None)

            ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
            expiry = time.time() + ttl
            self._store[key] = (value, expiry)

    def _prune_expired(self) -> None:
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()


# Global shared cache instances
research_search_cache = ResearchCache(default_ttl_seconds=600, max_entries=500)
research_paper_cache = ResearchCache(default_ttl_seconds=3600, max_entries=1000)
research_trends_cache = ResearchCache(default_ttl_seconds=1800, max_entries=100)
