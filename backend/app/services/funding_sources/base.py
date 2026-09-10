"""
Abstract base class for funding source clients — Module 4.
"""
from abc import ABC, abstractmethod
from typing import Any


class BaseFundingSourceClient(ABC):
    """
    Interface every funding source client must implement.

    Responsible only for HTTP requests + raw record return.
    Does NOT normalize, validate, or write to DB.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Unique identifier e.g. 'grants_gov'."""
        ...

    @abstractmethod
    def search(
        self,
        query: str,
        page: int = 1,
        per_page: int = 25,
    ) -> list[dict[str, Any]]:
        """
        Search for funding opportunities.

        Returns list of raw source records.
        Never raises — returns [] on any error.
        """
        ...
