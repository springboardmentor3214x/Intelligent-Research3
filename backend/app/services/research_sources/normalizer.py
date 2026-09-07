"""
Normalization layer — Module 3.

Converts raw OpenAlex (or any source) records into ResearchPaperCreate
Pydantic objects.  The database must NEVER depend on the external API's
raw response structure — all source-specific parsing is isolated here.
"""

import json
import logging
import re
from datetime import date
from typing import Any

from app.schemas.research_paper import ResearchPaperCreate

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# DOI normalisation
# ---------------------------------------------------------------------------

_DOI_PREFIXES = re.compile(
    r"^(https?://(dx\.)?doi\.org/|doi:\s*)",
    re.IGNORECASE,
)


def normalize_doi(raw_doi: str | None) -> str | None:
    """
    Return a canonical DOI string (bare ``10.xxxx/...`` form) or None.

    Handles all these formats:
        https://doi.org/10.1234/example
        http://dx.doi.org/10.1234/example
        DOI: 10.1234/example
        10.1234/example
    """
    if not raw_doi:
        return None
    cleaned = _DOI_PREFIXES.sub("", raw_doi.strip()).strip().lower()
    if not cleaned.startswith("10."):
        return None
    return cleaned


# ---------------------------------------------------------------------------
# Fingerprint helpers (for fallback duplicate detection)
# ---------------------------------------------------------------------------

_NON_ALPHA = re.compile(r"[^a-z0-9]")


def _make_fingerprint(text: str | None, max_len: int = 200) -> str | None:
    """Produce a normalised lowercase-alphanumeric fingerprint."""
    if not text:
        return None
    return _NON_ALPHA.sub("", text.casefold())[:max_len]


# ---------------------------------------------------------------------------
# OpenAlex abstract reconstruction
# ---------------------------------------------------------------------------

def _reconstruct_abstract(inverted_index: dict | None) -> str | None:
    """
    OpenAlex encodes abstracts as an inverted index: {word: [positions]}.
    Reconstruct the plain-text abstract from it.
    Returns None if the index is missing or malformed.
    """
    if not inverted_index or not isinstance(inverted_index, dict):
        return None
    try:
        # Build position → word mapping then join in order
        pos_word: dict[int, str] = {}
        for word, positions in inverted_index.items():
            if isinstance(positions, list):
                for pos in positions:
                    pos_word[pos] = word
        if not pos_word:
            return None
        return " ".join(pos_word[i] for i in sorted(pos_word))
    except Exception as exc:  # noqa: BLE001
        logger.debug("Failed to reconstruct abstract from inverted index: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Author extraction
# ---------------------------------------------------------------------------

def _extract_authors(authorships: list | None) -> list[str]:
    """Extract display names from OpenAlex authorships array."""
    if not authorships or not isinstance(authorships, list):
        return []
    names: list[str] = []
    for entry in authorships:
        if not isinstance(entry, dict):
            continue
        author = entry.get("author") or {}
        name = (author.get("display_name") or "").strip()
        if name:
            names.append(name)
    return names


# ---------------------------------------------------------------------------
# Keyword / concept extraction
# ---------------------------------------------------------------------------

def _extract_keywords(raw: list | None) -> list[str]:
    """Extract keyword display_names from OpenAlex keywords array."""
    if not raw or not isinstance(raw, list):
        return []
    result: list[str] = []
    for item in raw:
        if isinstance(item, dict):
            name = (item.get("display_name") or item.get("keyword") or "").strip()
        elif isinstance(item, str):
            name = item.strip()
        else:
            continue
        if name:
            result.append(name)
    return result


def _extract_concepts(raw: list | None, score_threshold: float = 0.3) -> list[str]:
    """Extract high-confidence concept display_names from OpenAlex concepts."""
    if not raw or not isinstance(raw, list):
        return []
    return [
        item["display_name"]
        for item in raw
        if isinstance(item, dict)
        and item.get("display_name")
        and float(item.get("score", 0)) >= score_threshold
    ]


# ---------------------------------------------------------------------------
# Date parsing
# ---------------------------------------------------------------------------

def _parse_date(raw: str | None) -> date | None:
    """Parse ISO-8601 date string (YYYY-MM-DD) safely."""
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Main normalizer
# ---------------------------------------------------------------------------

class OpenAlexNormalizer:
    """
    Converts a raw OpenAlex work dict into a ResearchPaperCreate schema.

    Returns None when the record cannot be safely normalised.
    The caller should skip None records and log the reason.
    """

    SOURCE_NAME = "openalex"

    def normalize(
        self,
        raw: dict[str, Any],
    ) -> ResearchPaperCreate | None:
        """
        Normalise a single raw OpenAlex record.

        Returns:
            ResearchPaperCreate on success.
            None if the record lacks the minimum required fields.
        """
        if not isinstance(raw, dict):
            logger.warning("Normalizer received non-dict record: %s", type(raw))
            return None

        # ---- external_id ------------------------------------------------
        external_id: str | None = raw.get("id")
        if external_id:
            # OpenAlex IDs look like https://openalex.org/W2741809807 — keep as-is
            external_id = str(external_id).strip()

        # ---- title (required) -------------------------------------------
        title: str | None = (raw.get("title") or "").strip() or None
        if not title:
            logger.info("Skipping record %s — missing title", external_id)
            return None

        # ---- abstract ---------------------------------------------------
        abstract = _reconstruct_abstract(raw.get("abstract_inverted_index"))

        # ---- DOI --------------------------------------------------------
        raw_doi = raw.get("doi")
        doi = normalize_doi(raw_doi)
        norm_doi = doi  # same canonical form

        # ---- authors ----------------------------------------------------
        authors = _extract_authors(raw.get("authorships"))

        # ---- dates ------------------------------------------------------
        pub_date_str: str | None = raw.get("publication_date")
        publication_date = _parse_date(pub_date_str)
        publication_year: int | None = raw.get("publication_year")
        if publication_year is not None:
            try:
                publication_year = int(publication_year)
            except (ValueError, TypeError):
                publication_year = None

        # ---- journal ----------------------------------------------------
        journal: str | None = None
        primary_location = raw.get("primary_location") or {}
        if isinstance(primary_location, dict):
            source = primary_location.get("source") or {}
            if isinstance(source, dict):
                journal = (source.get("display_name") or "").strip() or None

        # ---- keywords ---------------------------------------------------
        keywords = _extract_keywords(raw.get("keywords"))

        # ---- research areas (from concepts) ----------------------------
        research_area = _extract_concepts(raw.get("concepts"))

        # ---- URLs -------------------------------------------------------
        source_url: str | None = None
        if primary_location and isinstance(primary_location, dict):
            source_url = (primary_location.get("landing_page_url") or "").strip() or None

        open_access_url: str | None = None
        oa = raw.get("open_access") or {}
        if isinstance(oa, dict):
            open_access_url = (oa.get("oa_url") or "").strip() or None
        if not open_access_url:
            best_oa = raw.get("best_oa_location") or {}
            if isinstance(best_oa, dict):
                open_access_url = (best_oa.get("pdf_url") or "").strip() or None

        return ResearchPaperCreate(
            external_id=external_id,
            source=self.SOURCE_NAME,
            title=title,
            abstract=abstract,
            doi=doi,
            authors=authors,
            publication_date=publication_date,
            publication_year=publication_year,
            journal=journal,
            keywords=keywords,
            research_area=research_area,
            source_url=source_url,
            open_access_url=open_access_url,
        )


# ---------------------------------------------------------------------------
# Convenience export
# ---------------------------------------------------------------------------

def make_title_fingerprint(title: str | None) -> str | None:
    return _make_fingerprint(title, max_len=200)


def make_author_fingerprint(authors: list[str]) -> str | None:
    if not authors:
        return None
    return _make_fingerprint(authors[0], max_len=100)
