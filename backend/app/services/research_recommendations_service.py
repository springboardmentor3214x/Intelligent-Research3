"""
Research Recommendations Service — Module 3.

Generates personalized research paper recommendations based on the
authenticated researcher's Module 2 profile:
  - research_domain (from User.research_domain)
  - research_areas  (from ResearchTag kind=research_area)
  - research_keywords (from ResearchTag kind=research_keyword)

Changing the researcher's keywords or areas will change recommendations.
All recommendations come from real database papers — no hardcoding.
"""
import json
import logging
from typing import Any

from sqlalchemy import cast, or_, String
from sqlalchemy.orm import Session

from app.models.profile import ResearchProfile, ResearchTag
from app.models.research_paper import ResearchPaper
from app.models.user import User

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Profile extraction helpers
# ---------------------------------------------------------------------------

def _get_profile_signals(db: Session, user: User) -> dict[str, list[str]]:
    """
    Extract research signals from the user's Module 2 profile.

    Returns dict with:
      - research_domain: list with the user's primary domain
      - research_areas: list of research area strings
      - research_keywords: list of keyword strings
    """
    profile = (
        db.query(ResearchProfile)
        .filter(ResearchProfile.user_id == user.id)
        .first()
    )

    research_domain: list[str] = []
    if user.research_domain and user.research_domain.strip():
        research_domain = [user.research_domain.strip()]

    research_areas: list[str] = []
    research_keywords: list[str] = []

    if profile:
        tags = (
            db.query(ResearchTag)
            .filter(ResearchTag.profile_id == profile.id)
            .all()
        )
        for tag in tags:
            if tag.kind == "research_area":
                research_areas.append(tag.value)
            elif tag.kind == "research_keyword":
                research_keywords.append(tag.value)

    return {
        "research_domain": research_domain,
        "research_areas": research_areas,
        "research_keywords": research_keywords,
    }


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def _score_paper(
    paper: ResearchPaper,
    research_domain: list[str],
    research_areas: list[str],
    research_keywords: list[str],
) -> tuple[float, list[str]]:
    """
    Score a paper's relevance to the researcher's profile.

    Returns (score 0.0-1.0, list of match reasons).
    """
    score = 0.0
    reasons: list[str] = []
    hits = 0
    total_signals = max(len(research_areas) + len(research_keywords) + len(research_domain), 1)

    # Decode paper lists
    paper_areas = []
    if paper.research_area:
        try:
            paper_areas = json.loads(paper.research_area)
        except Exception:
            pass

    paper_keywords = []
    if paper.keywords:
        try:
            paper_keywords = json.loads(paper.keywords)
        except Exception:
            pass

    paper_areas_lower = [a.lower() for a in paper_areas]
    paper_keywords_lower = [k.lower() for k in paper_keywords]
    paper_title_lower = (paper.title or "").lower()
    paper_abstract_lower = (paper.abstract or "").lower()

    # Domain match
    for domain in research_domain:
        dl = domain.lower()
        if dl in paper_title_lower or dl in paper_abstract_lower:
            hits += 2
            reasons.append(f"Research domain '{domain}' found in paper content")
        elif any(dl in a for a in paper_areas_lower):
            hits += 1.5
            reasons.append(f"Research domain '{domain}' matches paper area")

    # Area match
    matched_areas = []
    for area in research_areas:
        al = area.lower()
        if any(al in pa for pa in paper_areas_lower) or any(al in pk for pk in paper_keywords_lower):
            hits += 1.5
            matched_areas.append(area)
        elif al in paper_title_lower or al in paper_abstract_lower:
            hits += 1
            matched_areas.append(area)
    if matched_areas:
        reasons.append(f"Research areas matched: {', '.join(matched_areas[:3])}")

    # Keyword match
    matched_kws = []
    for kw in research_keywords:
        kwl = kw.lower()
        if kwl in paper_keywords_lower or kwl in paper_title_lower:
            hits += 1
            matched_kws.append(kw)
        elif paper_abstract_lower and kwl in paper_abstract_lower:
            hits += 0.5
            matched_kws.append(kw)
    if matched_kws:
        reasons.append(f"Keywords matched: {', '.join(matched_kws[:5])}")

    # Normalize score to 0-1
    max_possible = total_signals * 1.5
    score = min(hits / max(max_possible, 1), 1.0)

    return round(score, 3), reasons


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def get_recommendations(
    db: Session,
    user: User,
    page: int = 1,
    page_size: int = 10,
) -> dict[str, Any]:
    """
    Return ranked paper recommendations for the authenticated user.

    Steps:
      1. Load Module 2 profile signals.
      2. Build a candidate SQL filter (at least one signal must match).
      3. Score each candidate.
      4. Sort by score descending.
      5. Paginate.

    Returns:
        Dict with: items, page, page_size, total, profile_signals_used
    """
    signals = _get_profile_signals(db, user)
    research_domain = signals["research_domain"]
    research_areas = signals["research_areas"]
    research_keywords = signals["research_keywords"]

    all_terms = research_domain + research_areas + research_keywords

    if not all_terms:
        # No profile signals — return most recent papers
        q = db.query(ResearchPaper).filter(
            ResearchPaper.publication_year.is_not(None)
        ).order_by(ResearchPaper.publication_year.desc())
        total = q.count()
        papers = q.offset((page - 1) * page_size).limit(page_size * 5).all()
        return {
            "items": [_paper_to_dict(p, 0.0, ["No profile signals set — showing recent papers"]) for p in papers[:page_size]],
            "page": page,
            "page_size": page_size,
            "total": total,
            "profile_signals_used": signals,
            "note": "Set research areas and keywords in your profile to get personalized recommendations.",
        }

    # Build a broad filter: any signal matches title/abstract/areas/keywords
    filters = []
    for term in all_terms:
        if term and term.strip():
            t = f"%{term.strip()}%"
            filters.append(ResearchPaper.title.ilike(t))
            filters.append(ResearchPaper.abstract.ilike(t))
            filters.append(cast(ResearchPaper.research_area, String).ilike(t))
            filters.append(cast(ResearchPaper.keywords, String).ilike(t))

    candidates = (
        db.query(ResearchPaper)
        .filter(or_(*filters))
        .limit(200)  # score top 200 candidates
        .all()
    )

    if not candidates:
        # Fallback: return most recent papers
        candidates = (
            db.query(ResearchPaper)
            .filter(ResearchPaper.publication_year.is_not(None))
            .order_by(ResearchPaper.publication_year.desc())
            .limit(50)
            .all()
        )

    # Score candidates
    scored: list[tuple[float, list[str], ResearchPaper]] = []
    for paper in candidates:
        score, reasons = _score_paper(paper, research_domain, research_areas, research_keywords)
        scored.append((score, reasons, paper))

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    total = len(scored)
    start = (page - 1) * page_size
    page_items = scored[start:start + page_size]

    return {
        "items": [
            _paper_to_dict(paper, score, reasons)
            for score, reasons, paper in page_items
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
        "profile_signals_used": signals,
    }


def _paper_to_dict(paper: ResearchPaper, score: float, reasons: list[str]) -> dict[str, Any]:
    """Serialize a paper with its recommendation score."""
    return {
        "id": paper.id,
        "title": paper.title,
        "authors": paper.get_authors(),
        "abstract": paper.abstract,
        "publication_year": paper.publication_year,
        "publication_date": paper.publication_date.isoformat() if paper.publication_date else None,
        "journal": paper.journal,
        "doi": paper.doi,
        "source_url": paper.source_url,
        "open_access_url": paper.open_access_url,
        "keywords": paper.get_keywords(),
        "research_area": paper.get_research_area(),
        "source": paper.source,
        "relevance_score": score,
        "match_reasons": reasons,
        "created_at": paper.created_at.isoformat(),
        "updated_at": paper.updated_at.isoformat(),
    }
