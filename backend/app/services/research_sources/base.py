"""
Abstract base class for research source clients — Module 3.

New sources can be added by subclassing BaseResearchSourceClient
and implementing the `search` method.
"""

from abc import ABC, abstractmethod
from typing import Any


class BaseResearchSourceClient(ABC):
    """
    Interface that every external research source client must implement.

    A source client is responsible ONLY for:
    - Making HTTP requests to the external API
    - Returning raw records from that source
    - Handling transport-level errors (timeout, HTTP errors)

    It must NOT:
    - Parse or normalize records into internal models
    - Write to the database
    - Apply business rules
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Unique identifier for this source (e.g. 'openalex', 'crossref')."""
        ...

    @abstractmethod
    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
    ) -> list[dict[str, Any]]:
        """
        Search for research papers by keyword/topic.

        Args:
            query:    Search keywords/topic.
            page:     1-based page number.
            per_page: Maximum number of records per page.

        Returns:
            List of raw source records (dicts). Never raises — returns []
            if the upstream API fails so callers can continue.
        """
        ...
