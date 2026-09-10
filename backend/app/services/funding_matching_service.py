"""
Funding Matching Service — Module 4.

Computes a transparent, explainable relevance score between a researcher
profile (Module 2) and a funding opportunity.

Score breakdown (all components add to 1.0):
  - Research area overlap : 40%
  - Keyword overlap       : 40%
  - Country match         : 10%
  - Funding type relevance: 10%

The score is deterministic: same inputs always produce the same score.
No black-box AI scoring.
"""
import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.models.funding import FundingOpportunity
from app.models.profile import ResearchProfile, ResearchTag
from app.models.user import User
from app.repositories.funding_repository import (
    get_funding_by_id,
    get_open_funding_candidates,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Weight configuration (must sum to 1.0)
# ---------------------------------------------------------------------------

WEIGHT_AREA = 0.40
WEIGHT_KEYWORD = 0.40
WEIGHT_COUNTRY = 0.10
WEIGHT_TYPE = 0.10


# ---------------------------------------------------------------------------
# Profile extraction
# ---------------------------------------------------------------------------

def _get_researcher_signals(db: Session, user: User) -> dict[str, Any]:
    """Extract research signals from the user's Module 2 profile."""
    profile = (
        db.query(ResearchProfile)
        .filter(ResearchProfile.user_id == user.id)
        .first()
    )

    research_domain = [user.research_domain.strip()] if user.research_domain else []
    research_areas: list[str] = []
    research_keywords: list[str] = []

    if profile:
        tags = db.query(ResearchTag).filter(ResearchTag.profile_id == profile.id).all()
        for tag in tags:
            if tag.kind == "research_area":
                research_areas.append(tag.value)
            elif tag.kind == "research_keyword":
                research_keywords.append(tag.value)

    return {
        "research_domain": research_domain,
        "research_areas": research_areas,
        "research_keywords": research_keywords,
        "country": user.country or None,
    }


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _parse_json_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        val = json.loads(raw)
        return [str(v) for v in val if v] if isinstance(val, list) else []
    except Exception:
        return []


def _overlap_score(profile_terms: list[str], funding_terms: list[str]) -> tuple[float, list[str]]:
    """
    Compute Jaccard-style overlap score between two term lists.
    Returns (score 0-1, matched_terms).
    """
    if not profile_terms or not funding_terms:
        return 0.0, []

    profile_lower = {t.lower() for t in profile_terms}
    matched = []

    for f_term in funding_terms:
        fl = f_term.lower()
        for p_term in profile_lower:
            if p_term in fl or fl in p_term:
                matched.append(f_term)
                break

    if not matched:
        return 0.0, []

    score = len(matched) / max(len(profile_lower), len(funding_terms))
    return min(score, 1.0), matched


def _country_score(user_country: str | None, funding_country: str | None) -> float:
    """1.0 if countries match or funding is unrestricted, else 0.0."""
    if not funding_country or funding_country.lower() in ("", "worldwide", "global", "international"):
        return 1.0
    if not user_country:
        return 0.5  # partial — country not set
    return 1.0 if user_country.strip().lower() == funding_country.strip().lower() else 0.0


def _type_score(funding_type: str | None) -> float:
    """Grant and fellowship are most relevant; contracts less so."""
    if not funding_type:
        return 0.7
    t = funding_type.lower()
    if t in ("grant", "fellowship"):
        return 1.0
    if t in ("cooperative_agreement",):
        return 0.8
    if t in ("contract",):
        return 0.5
    return 0.7


# ---------------------------------------------------------------------------
# Main match function
# ---------------------------------------------------------------------------

def match_funding(
    db: Session,
    funding_id: int,
    research_domain: list[str],
    research_areas: list[str],
    keywords: list[str],
    user_country: str | None = None,
) -> dict[str, Any]:
    """
    Compute a transparent match score for one funding opportunity.

    Returns dict with:
      funding_id, match_score, matched_areas, matched_keywords,
      reasons, eligibility_flags
    """
    opp = get_funding_by_id(db, funding_id)
    if opp is None:
        raise ValueError(f"Funding opportunity {funding_id} not found.")

    opp_areas = _parse_json_list(opp.research_areas)
    opp_keywords = _parse_json_list(opp.keywords)

    # Combine domain + areas for area matching
    all_profile_areas = research_domain + research_areas

    # Area score
    area_score, matched_areas = _overlap_score(all_profile_areas, opp_areas)

    # Check title/description for area terms (secondary signal)
    if area_score < 0.3:
        opp_text_terms = []
        if opp.title:
            opp_text_terms += opp.title.lower().split()
        for p_area in all_profile_areas:
            if p_area.lower() in (opp.title or "").lower() or p_area.lower() in (opp.description or "").lower():
                if p_area not in matched_areas:
                    matched_areas.append(p_area)
                    area_score = min(area_score + 0.2, 1.0)

    # Keyword score
    all_profile_keywords = keywords + research_areas
    kw_score, matched_keywords = _overlap_score(all_profile_keywords, opp_keywords)

    # Check title/description for keyword terms
    if kw_score < 0.3:
        for kw in keywords:
            if kw.lower() in (opp.title or "").lower() or kw.lower() in (opp.description or "").lower():
                if kw not in matched_keywords:
                    matched_keywords.append(kw)
                    kw_score = min(kw_score + 0.15, 1.0)

    country_score = _country_score(user_country, opp.country)
    type_score = _type_score(opp.funding_type)

    # Weighted composite score
    total_score = (
        WEIGHT_AREA * area_score
        + WEIGHT_KEYWORD * kw_score
        + WEIGHT_COUNTRY * country_score
        + WEIGHT_TYPE * type_score
    )

    # Build human-readable reasons
    reasons: list[str] = []
    if matched_areas:
        reasons.append(f"Research areas matched: {', '.join(matched_areas[:3])}")
    if matched_keywords:
        reasons.append(f"Keywords matched: {', '.join(matched_keywords[:5])}")
    if country_score == 1.0 and opp.country:
        reasons.append(f"Country match: {opp.country}")
    elif country_score == 1.0:
        reasons.append("Funding is open to international applicants")
    if opp.funding_type in ("grant", "fellowship"):
        reasons.append(f"Funding type '{opp.funding_type}' is highly relevant for researchers")
    if not reasons:
        reasons.append("General alignment based on funding area")

    # Eligibility flags
    eligibility_flags: list[str] = []
    if opp.eligibility:
        eligibility_flags.append(f"Eligibility requirement: {opp.eligibility[:200]}")

    return {
        "funding_id": funding_id,
        "match_score": round(total_score, 3),
        "matched_areas": matched_areas,
        "matched_keywords": matched_keywords,
        "reasons": reasons,
        "eligibility_flags": eligibility_flags,
        "score_breakdown": {
            "area_score": round(area_score, 3),
            "keyword_score": round(kw_score, 3),
            "country_score": round(country_score, 3),
            "type_score": round(type_score, 3),
            "weights": {
                "area": WEIGHT_AREA,
                "keyword": WEIGHT_KEYWORD,
                "country": WEIGHT_COUNTRY,
                "type": WEIGHT_TYPE,
            },
        },
    }


# ---------------------------------------------------------------------------
# Ranked Recommendations
# ---------------------------------------------------------------------------

def get_funding_recommendations(
    db: Session,
    user: User,
    page: int = 1,
    page_size: int = 10,
) -> dict[str, Any]:
    """
    Rank open funding opportunities by relevance to the user's profile.

    Steps:
      1. Load Module 2 profile signals.
      2. Retrieve open funding candidates (broad filter).
      3. Score each candidate.
      4. Sort by score descending.
      5. Paginate.
    """
    signals = _get_researcher_signals(db, user)
    research_domain = signals["research_domain"]
    research_areas = signals["research_areas"]
    research_keywords = signals["research_keywords"]
    user_country = signals["country"]

    all_terms = research_domain + research_areas + research_keywords

    # Get broad candidate set
    candidates = get_open_funding_candidates(
        db,
        research_areas=research_domain + research_areas,
        keywords=research_keywords,
        limit=200,
    )

    # If no candidates from profile filter, fall back to all open opportunities
    if not candidates:
        candidates = (
            db.query(FundingOpportunity)
            .filter(FundingOpportunity.status == "open")
            .limit(100)
            .all()
        )

    # Score each candidate
    scored: list[tuple[float, dict, FundingOpportunity]] = []
    for opp in candidates:
        opp_areas = _parse_json_list(opp.research_areas)
        opp_keywords = _parse_json_list(opp.keywords)

        area_score, matched_areas = _overlap_score(research_domain + research_areas, opp_areas)
        kw_score, matched_keywords = _overlap_score(research_keywords + research_areas, opp_keywords)

        # Text signal boost
        for term in all_terms:
            if term.lower() in (opp.title or "").lower() or term.lower() in (opp.description or "").lower():
                area_score = min(area_score + 0.1, 1.0)
                break

        country_score = _country_score(user_country, opp.country)
        type_score = _type_score(opp.funding_type)

        total = (
            WEIGHT_AREA * area_score
            + WEIGHT_KEYWORD * kw_score
            + WEIGHT_COUNTRY * country_score
            + WEIGHT_TYPE * type_score
        )

        reasons = []
        if matched_areas:
            reasons.append(f"Research areas matched: {', '.join(matched_areas[:3])}")
        if matched_keywords:
            reasons.append(f"Keywords matched: {', '.join(matched_keywords[:5])}")
        if not reasons:
            reasons.append("General alignment based on funding domain")

        scored.append((
            total,
            {
                "matched_areas": matched_areas,
                "matched_keywords": matched_keywords,
                "reasons": reasons,
                "match_score": round(total, 3),
            },
            opp,
        ))

    scored.sort(key=lambda x: x[0], reverse=True)

    total_count = len(scored)
    start = (page - 1) * page_size
    page_items = scored[start:start + page_size]

    def _opp_to_dict(opp: FundingOpportunity, match_info: dict) -> dict:
        return {
            "id": opp.id,
            "title": opp.title,
            "organization": opp.organization,
            "description": opp.description,
            "funding_amount": opp.funding_amount,
            "funding_amount_max": opp.funding_amount_max,
            "currency": opp.currency,
            "deadline": opp.deadline.isoformat() if opp.deadline else None,
            "status": opp.status,
            "funding_type": opp.funding_type,
            "country": opp.country,
            "research_areas": opp.get_research_areas(),
            "keywords": opp.get_keywords(),
            "eligibility": opp.eligibility,
            "source_url": opp.source_url,
            "application_url": opp.application_url,
            "source": opp.source,
            "created_at": opp.created_at.isoformat(),
            "updated_at": opp.updated_at.isoformat(),
            **match_info,
        }

    return {
        "items": [_opp_to_dict(opp, match_info) for _, match_info, opp in page_items],
        "page": page,
        "page_size": page_size,
        "total": total_count,
        "profile_signals_used": signals,
    }
