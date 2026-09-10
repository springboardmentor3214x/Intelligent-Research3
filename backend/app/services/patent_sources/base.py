"""
Abstract base class for patent data source clients — Module 5.
"""

from abc import ABC, abstractmethod
from typing import Any


class BasePatentSourceClient(ABC):
    """
    Interface for external patent data providers (USPTO Open Data Portal, The Lens).
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Identifier for this source (e.g. 'uspto', 'lens')."""
        ...

    @abstractmethod
    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """
        Search for real patent records by keyword / query string.

        Args:
            query: Search terms (e.g. 'Artificial Intelligence', 'Machine Learning')
            page: 1-based page index
            per_page: Number of items per request
            **kwargs: Provider-specific filters (assignee, classification, etc.)

        Returns:
            List of raw dictionaries directly returned by the provider.
        """
        ...
