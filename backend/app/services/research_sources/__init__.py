"""research_sources package — Module 3."""

from app.services.research_sources.base import BaseResearchSourceClient
from app.services.research_sources.normalizer import OpenAlexNormalizer, normalize_doi
from app.services.research_sources.openalex_client import OpenAlexClient

__all__ = [
    "BaseResearchSourceClient",
    "OpenAlexClient",
    "OpenAlexNormalizer",
    "normalize_doi",
]
