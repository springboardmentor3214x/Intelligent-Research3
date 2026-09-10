"""
Semantic Scholar normalizer — Module 3.

Converts raw Semantic Scholar paper records into ResearchPaperCreate
Pydantic objects. All S2-specific parsing is isolated here so the
database layer stays source-agnostic.

S2 paper record shape (relevant fields):
{
  "paperId": "649def34f8be52c8b66281af98ae884c09aef38b",
  "externalIds": {"DOI": "10.1234/...", "ArXiv": "..."},
  "title": "...",
  "abstract": "...",
  "authors": [{"authorId": "...", "name": "..."}],
  "year": 2024,
  "publicationDate": "2024-01-15",
  "venue": "NeurIPS",
  "publicationVenue": {"name": "...", "type": "..."},
  "fieldsOfStudy": ["Computer Science"],
  "s2FieldsOfStudy": [{"category": "Computer Science", "source": "s2-fos-model"}],
  "openAccessPdf": {"url": "https://...", "status": "GREEN"},
  "isOpenAccess": true,
  "url": "https://www.semanticscholar.org/paper/...",
  "citationCount": 42
}
"""

import logging
import re
from datetime import date
from typing import Any

from app.schemas.research_paper import ResearchPaperCreate

logger = logging.getLogger(__name__)


_DOI_PREFIXES = re.compile(
    r"^(https?://(dx\.)?doi\.org/|doi:\s*)",
    re.IGNORECASE,
)


def _normalize_doi(raw_doi: str | None) -> str | None:
    """Return canonical DOI (bare 10.xxx/... form) or None."""
    if not raw_doi:
        return None
    cleaned = _DOI_PREFIXES.sub("", raw_doi.strip()).strip().lower()
    return cleaned if cleaned.startswith("10.") else None


def _parse_date(raw: str | None) -> date | None:
    """Parse ISO-8601 date string (YYYY-MM-DD) safely."""
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except (ValueError, TypeError):
        return None


def _extract_authors(raw_authors: list | None) -> list[str]:
    """Extract author names from S2 authors array."""
    if not raw_authors or not isinstance(raw_authors, list):
        return []
    names: list[str] = []
    for entry in raw_authors:
        if not isinstance(entry, dict):
            continue
        name = (entry.get("name") or "").strip()
        if name:
            names.append(name)
    return names


def _extract_research_areas(
    fields_of_study: list | None,
    s2_fields: list | None,
) -> list[str]:
    """Build a deduplicated list of research area strings."""
    areas: list[str] = []
    seen: set[str] = set()

    # Primary: top-level fieldsOfStudy
    for f in (fields_of_study or []):
        if isinstance(f, str) and f.strip() and f not in seen:
            areas.append(f.strip())
            seen.add(f.strip())

    # Secondary: s2FieldsOfStudy (AI-classified)
    for item in (s2_fields or []):
        if isinstance(item, dict):
            cat = (item.get("category") or "").strip()
            if cat and cat not in seen:
                areas.append(cat)
                seen.add(cat)

    return areas[:10]  # cap at 10


class SemanticScholarNormalizer:
    """
    Converts a raw Semantic Scholar paper dict into a ResearchPaperCreate schema.

    Returns None when the record cannot be safely normalised (e.g. no title).
    Callers should skip None records.
    """

    SOURCE_NAME = "semantic_scholar"

    def normalize(self, raw: dict[str, Any]) -> ResearchPaperCreate | None:
        """
        Normalise a single raw Semantic Scholar record.

        Returns:
            ResearchPaperCreate on success.
            None if the record lacks minimum required fields.
        """
        if not isinstance(raw, dict):
            logger.warning("S2 normalizer received non-dict record: %s", type(raw))
            return None

        # ---- external_id ------------------------------------------------
        external_id: str | None = raw.get("paperId")
        if external_id:
            external_id = str(external_id).strip()

        # ---- title (required) -------------------------------------------
        title: str | None = (raw.get("title") or "").strip() or None
        if not title:
            logger.info("Skipping S2 record %s — missing title", external_id)
            return None

        # ---- abstract ---------------------------------------------------
        abstract: str | None = (raw.get("abstract") or "").strip() or None

        # ---- DOI --------------------------------------------------------
        external_ids = raw.get("externalIds") or {}
        doi = _normalize_doi(external_ids.get("DOI"))

        # ---- authors ----------------------------------------------------
        authors = _extract_authors(raw.get("authors"))

        # ---- dates ------------------------------------------------------
        publication_date = _parse_date(raw.get("publicationDate"))
        publication_year: int | None = raw.get("year")
        if publication_year is not None:
            try:
                publication_year = int(publication_year)
            except (ValueError, TypeError):
                publication_year = None

        # Derive year from date if not present
        if publication_year is None and publication_date:
            publication_year = publication_date.year

        # ---- journal / venue --------------------------------------------
        journal: str | None = None
        pub_venue = raw.get("publicationVenue") or {}
        if isinstance(pub_venue, dict):
            journal = (pub_venue.get("name") or "").strip() or None
        if not journal:
            journal = (raw.get("venue") or "").strip() or None

        # ---- research areas ---------------------------------------------
        research_area = _extract_research_areas(
            raw.get("fieldsOfStudy"),
            raw.get("s2FieldsOfStudy"),
        )

        # ---- keywords (use areas as keywords if none explicit) ----------
        keywords: list[str] = list(research_area)  # S2 has no separate keyword field

        # ---- URLs -------------------------------------------------------
        source_url: str | None = (raw.get("url") or "").strip() or None

        open_access_url: str | None = None
        oa_pdf = raw.get("openAccessPdf") or {}
        if isinstance(oa_pdf, dict):
            open_access_url = (oa_pdf.get("url") or "").strip() or None

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
