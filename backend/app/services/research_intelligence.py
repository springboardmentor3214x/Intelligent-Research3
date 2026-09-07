from collections import Counter
from datetime import date
import logging
import re

import httpx
from sqlalchemy.orm import Session

from app.models.profile import Publication, ResearchProfile, ResearchTag, TagKind
from app.models.user import User
from app.services.ai_provider import LocalHeuristicProvider, get_ai_provider

logger = logging.getLogger(__name__)
STOP_WORDS = {"and", "the", "for", "with", "from", "using", "study", "analysis", "research"}
OPENALEX_WORKS_URL = "https://api.openalex.org/works"


def _tokens(value: str | None) -> list[str]:
    return [token for token in re.findall(r"[A-Za-z][A-Za-z0-9-]{2,}", value or "") if token.casefold() not in STOP_WORDS]


def _normalize_openalex_work(work: dict) -> dict:
    primary_location = work.get("primary_location") or {}
    source = primary_location.get("source") or {}
    authors = [
        authorship.get("author", {}).get("display_name")
        for authorship in work.get("authorships", [])
        if authorship.get("author", {}).get("display_name")
    ]
    topics = list(dict.fromkeys(
        topic.get("display_name")
        for topic in work.get("topics", [])
        if topic.get("display_name")
    ))
    return {
        "openalex_id": work.get("id", "").rsplit("/", 1)[-1],
        "title": (work.get("title") or "").strip(),
        "authors": authors,
        "publication_date": work.get("publication_date"),
        "publication_type": work.get("type"),
        "journal_or_conference": source.get("display_name"),
        "doi": work.get("doi"),
        "publication_link": primary_location.get("landing_page_url"),
        "cited_by_count": work.get("cited_by_count", 0),
        "topics": topics,
    }


def search_openalex_publications(query: str, from_date: date, to_date: date, page: int = 1, per_page: int = 20) -> dict:
    params = {
        "search": query,
        "filter": f"from_publication_date:{from_date.isoformat()},to_publication_date:{to_date.isoformat()}",
        "page": page,
        "per-page": per_page,
    }
    try:
        response = httpx.get(OPENALEX_WORKS_URL, params=params, timeout=15.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError("OpenAlex publication search is unavailable") from exc
    payload = response.json()
    return {
        "query": query,
        "filters": {"from_publication_date": from_date.year, "to_publication_date": to_date.year},
        "total_results": (payload.get("meta") or {}).get("count", 0),
        "page": page,
        "per_page": per_page,
        "publications": [_normalize_openalex_work(work) for work in payload.get("results", [])],
    }


def _topics(paper: Publication) -> list[str]:
    values = [item.strip() for item in (paper.keywords or "").replace(";", ",").split(",") if item.strip()]
    return list(dict.fromkeys(values + _tokens(paper.publication_title)))


def _corpus(db: Session, user: User, research_domain: str | None = None, research_area: str | None = None, keyword: str | None = None, start_year: int | None = None, end_year: int | None = None) -> list[Publication]:
    profile = db.query(ResearchProfile).filter_by(user_id=user.id).first()
    if profile is None:
        return []
    papers = db.query(Publication).filter(Publication.profile_id == profile.id).all()
    def matches(paper: Publication) -> bool:
        year = paper.publication_date.year if paper.publication_date else None
        haystack = " ".join([paper.publication_title, paper.research_domain or "", paper.keywords or ""]).casefold()
        return ((not research_domain or research_domain.casefold() in (paper.research_domain or "").casefold())
                and (not research_area or research_area.casefold() in haystack)
                and (not keyword or keyword.casefold() in haystack)
                and (start_year is None or (year is not None and year >= start_year))
                and (end_year is None or (year is not None and year <= end_year)))
    return [paper for paper in papers if matches(paper)]


def analyze_paper(db: Session, paper_id: int, user: User) -> dict | None:
    paper = next((item for item in _corpus(db, user) if item.id == paper_id), None)
    if paper is None:
        return None
    topics = _topics(paper)
    context = {"title": paper.publication_title, "topics": topics, "content_basis": "stored title, keywords, and domain metadata"}
    try:
        provider = get_ai_provider()
        analysis = provider.analyze(context)
        fallback_used = False
    except Exception:
        logger.exception("AI analysis failed for publication %s", paper_id)
        provider = LocalHeuristicProvider()
        analysis = provider.analyze(context)
        fallback_used = True
    return {"source": {"id": paper.id, "title": paper.publication_title, "authors": [author.strip() for author in paper.authors.split(",") if author.strip()], "publication_year": paper.publication_date.year if paper.publication_date else None, "doi": paper.doi, "source_url": str(paper.publication_link) if paper.publication_link else None, "content_basis": context["content_basis"]}, "ai_analysis": analysis, "provider": provider.name, "fallback_used": fallback_used}


def _topic_growth(papers: list[Publication]) -> list[dict]:
    years = [paper.publication_date.year for paper in papers if paper.publication_date]
    if not years:
        return []
    latest = max(years)
    current = Counter(topic.casefold() for paper in papers if paper.publication_date and paper.publication_date.year == latest for topic in _topics(paper))
    previous = Counter(topic.casefold() for paper in papers if paper.publication_date and paper.publication_date.year < latest for topic in _topics(paper))
    return [{"topic": topic, "current_count": count, "previous_count": previous[topic], "growth": count - previous[topic], "evidence_count": count, "confidence": "low" if len(set(years)) < 3 else "moderate", "observation": "Observed growth in the latest represented year."} for topic, count in current.most_common(10) if count > previous[topic]]


def calculate_trends(db: Session, user: User, filters: dict) -> dict:
    papers = _corpus(db, user, **filters)
    years = Counter(paper.publication_date.year for paper in papers if paper.publication_date)
    topics = Counter(topic for paper in papers for topic in _topics(paper))
    return {"filters": filters, "publication_trends": [{"year": year, "count": years[year]} for year in sorted(years)], "top_topics": [{"topic": topic, "paper_count": count} for topic, count in topics.most_common(10)], "topic_growth": _topic_growth(papers)}


def build_insights(db: Session, user: User, filters: dict) -> dict:
    trends = calculate_trends(db, user, filters)
    papers = _corpus(db, user, **filters)
    return {"metrics": {"papers_analyzed": len(papers), "top_topics": trends["top_topics"], "publication_trend": trends["publication_trends"]}, "ai_interpretation": {"key_themes": [item["topic"] for item in trends["top_topics"][:5]], "research_directions": [item["topic"] for item in trends["topic_growth"][:5]], "observed_gaps": ["The corpus is empty; no gap observation is available."] if not papers else ["The available metadata does not establish research gaps."]}}


def recommendations(db: Session, user: User, limit: int = 10) -> list[dict]:
    profile = db.query(ResearchProfile).filter_by(user_id=user.id).first()
    if profile is None:
        return []
    tags = db.query(ResearchTag).filter_by(profile_id=profile.id).all()
    areas = {tag.value for tag in tags if tag.kind == TagKind.RESEARCH_AREA.value}
    keywords = {tag.value for tag in tags if tag.kind == TagKind.RESEARCH_KEYWORD.value}
    result = []
    for paper in db.query(Publication).filter(Publication.profile_id == profile.id).all():
        text = " ".join([paper.publication_title, paper.research_domain or "", paper.keywords or ""]).casefold()
        matched_areas = [area for area in areas if area.casefold() in text]
        matched_keywords = [keyword for keyword in keywords if keyword.casefold() in text]
        domain_match = bool(user.research_domain and user.research_domain.casefold() in (paper.research_domain or "").casefold())
        score = min(1.0, 0.25 * bool(domain_match) + 0.30 * min(1, len(matched_areas)) + 0.15 * min(3, len(matched_keywords)))
        if score:
            reasons = (["Matches research domain"] if domain_match else []) + (["Matches research area"] if matched_areas else []) + (["Matches researcher keyword"] if matched_keywords else [])
            result.append({"paper_id": paper.id, "title": paper.publication_title, "relevance_score": round(score, 2), "matched_areas": matched_areas, "matched_keywords": matched_keywords, "reasons": reasons})
    return sorted(result, key=lambda item: item["relevance_score"], reverse=True)[:limit]