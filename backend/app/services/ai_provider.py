from abc import ABC, abstractmethod
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    pass


class AIProvider(ABC):
    name = "unknown"

    @abstractmethod
    def analyze(self, paper_context: dict) -> dict:
        raise NotImplementedError


class LocalHeuristicProvider(AIProvider):
    name = "local-heuristic"

    def analyze(self, paper_context: dict) -> dict:
        title = paper_context["title"]
        topics = paper_context["topics"] or ["the stated research area"]
        basis = paper_context["content_basis"]
        return {
            "summary": f"Metadata-based analysis of '{title}' focused on {', '.join(topics[:3])}.",
            "problem": f"The publication addresses a problem in {topics[0]}, based on its title and indexed metadata.",
            "methodology": "Methodology details were not available in the stored record; no unsupported method is inferred.",
            "findings": [f"The record is indexed with: {', '.join(topics[:5])}."],
            "limitations": [f"Only {basis} was available; full text findings cannot be verified."],
            "future_directions": ["Review the full paper and abstract before drawing substantive conclusions."],
        }


def get_ai_provider() -> AIProvider:
    settings = get_settings()
    if settings.AI_PROVIDER.casefold() in {"local", "heuristic", "fallback"}:
        return LocalHeuristicProvider()
    logger.warning("Unsupported AI provider '%s'; using local fallback", settings.AI_PROVIDER)
    return LocalHeuristicProvider()