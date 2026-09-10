"""
Research Trends Service — Module 3.

Aggregates actual database research-paper data to produce:
  - Publication count by year
  - Top research areas (by paper count)
  - Top keywords (by paper count)
  - Emerging topics (areas with recent growth)

All numbers come from the real database — nothing is hardcoded.
"""
import json
import logging
from collections import Counter
from datetime import datetime
from typing import Any

from sqlalchemy import cast, func, String
from sqlalchemy.orm import Session

from app.models.research_paper import ResearchPaper

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_json_list(raw: Any) -> list[str]:
    """Safely decode a JSON-encoded list column or return already deserialized list."""
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(v) for v in raw if v]
    try:
        value = json.loads(raw)
        if isinstance(value, list):
            return [str(v) for v in value if v]
        return []
    except (json.JSONDecodeError, TypeError):
        return []


# ---------------------------------------------------------------------------
# Core aggregation functions
# ---------------------------------------------------------------------------

def get_publications_by_year(db: Session, domain_filter: str | None = None) -> list[dict[str, Any]]:
    """
    Return publication counts grouped by year for papers in the DB.
    Excludes rows where publication_year is NULL.
    """
    q = (
        db.query(ResearchPaper.publication_year, func.count(ResearchPaper.id).label("count"))
        .filter(ResearchPaper.publication_year.is_not(None))
    )
    if domain_filter:
        q = q.filter(cast(ResearchPaper.research_area, String).ilike(f"%{domain_filter}%"))

    rows = (
        q.group_by(ResearchPaper.publication_year)
        .order_by(ResearchPaper.publication_year.asc())
        .all()
    )
    return [{"year": row[0], "count": row[1]} for row in rows]


def get_top_research_areas(db: Session, limit: int = 15) -> list[dict[str, Any]]:
    """
    Return the most common research areas across all ingested papers.
    Research areas are stored as JSON arrays — we decode and count.
    """
    area_counter: Counter = Counter()

    rows = db.query(ResearchPaper.research_area).filter(
        ResearchPaper.research_area.is_not(None)
    ).all()

    for (raw,) in rows:
        areas = _parse_json_list(raw)
        area_counter.update(areas)

    return [
        {"area": area, "count": cnt}
        for area, cnt in area_counter.most_common(limit)
    ]


def get_top_keywords(db: Session, limit: int = 20) -> list[dict[str, Any]]:
    """
    Return the most common keywords across all ingested papers.
    Keywords are stored as JSON arrays.
    """
    kw_counter: Counter = Counter()

    rows = db.query(ResearchPaper.keywords).filter(
        ResearchPaper.keywords.is_not(None)
    ).all()

    for (raw,) in rows:
        kw_counter.update(_parse_json_list(raw))

    return [
        {"keyword": kw, "count": cnt}
        for kw, cnt in kw_counter.most_common(limit)
    ]


def get_emerging_topics(db: Session, recent_years: int = 3, min_papers: int = 1) -> list[dict[str, Any]]:
    """
    Identify research areas that have grown significantly in recent years.

    Strategy:
      - Compute paper count per area for recent_years vs. prior period.
      - Areas with only recent papers are flagged as emerging.
      - Return sorted by recent count descending.

    Observations are labeled as observations, not proven facts.
    """
    current_year = datetime.now().year
    recent_cutoff = current_year - recent_years

    # Count per area in recent period
    recent_rows = db.query(ResearchPaper.research_area).filter(
        ResearchPaper.research_area.is_not(None),
        ResearchPaper.publication_year >= recent_cutoff,
    ).all()

    recent_counter: Counter = Counter()
    for (raw,) in recent_rows:
        recent_counter.update(_parse_json_list(raw))

    # Count per area in older period
    older_rows = db.query(ResearchPaper.research_area).filter(
        ResearchPaper.research_area.is_not(None),
        ResearchPaper.publication_year < recent_cutoff,
    ).all()

    older_counter: Counter = Counter()
    for (raw,) in older_rows:
        older_counter.update(_parse_json_list(raw))

    # Compute growth for areas with enough recent papers
    results: list[dict[str, Any]] = []
    for area, recent_count in recent_counter.items():
        if recent_count < min_papers:
            continue
        older_count = older_counter.get(area, 0)
        if older_count == 0:
            growth_label = "New area in dataset"
            growth_pct = None
        else:
            growth_pct = round(((recent_count - older_count) / older_count) * 100, 1)
            if growth_pct > 100:
                growth_label = f"+{growth_pct}% (observation)"
            elif growth_pct > 0:
                growth_label = f"+{growth_pct}% (observation)"
            else:
                growth_label = f"{growth_pct}% (declining)"

        results.append({
            "area": area,
            "recent_count": recent_count,
            "older_count": older_count,
            "growth_label": growth_label,
            "observation": (
                f"Observation: '{area}' appears in {recent_count} paper(s) "
                f"from the last {recent_years} years in the current dataset. "
                "This reflects dataset composition and is NOT a validated trend claim."
            ),
        })

    results.sort(key=lambda x: x["recent_count"], reverse=True)
    return results[:10]


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def get_research_trends(
    db: Session,
    domain_filter: str | None = None,
) -> dict[str, Any]:
    """
    Build a complete research trends report from real DB data.

    Args:
        db: SQLAlchemy session.
        domain_filter: Optional domain keyword to filter papers.

    Returns:
        Dict containing:
          - total_papers: int
          - publications_by_year: list of {year, count}
          - top_research_areas: list of {area, count}
          - top_keywords: list of {keyword, count}
          - emerging_topics: list of {area, recent_count, growth_label, observation}
          - data_note: explains data source
    """
    total_papers = db.query(func.count(ResearchPaper.id)).scalar() or 0

    pubs_by_year = get_publications_by_year(db, domain_filter=domain_filter)
    top_areas = get_top_research_areas(db)
    top_keywords = get_top_keywords(db)
    emerging = get_emerging_topics(db)

    return {
        "total_papers": total_papers,
        "publications_by_year": pubs_by_year,
        "top_research_areas": top_areas,
        "top_keywords": top_keywords,
        "emerging_topics": emerging,
        "data_note": (
            f"Trends are derived from {total_papers} research papers currently ingested "
            "in the platform database from OpenAlex. All numbers reflect the actual dataset "
            "contents — no values are hardcoded or estimated."
        ),
    }
