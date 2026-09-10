"""
Research Papers Router — Module 3.

Endpoints:
  GET  /api/research/papers                        — list / search papers
  GET  /api/research/papers/saved                  — saved papers for current user
  GET  /api/research/trends                        — real-data trend analysis
  GET  /api/research/recommendations               — profile-based recommendations (DB)
  GET  /api/research/papers/{paper_id}             — paper detail
  POST /api/research/papers/{paper_id}/save        — save paper
  POST /api/research/papers/{paper_id}/analyze     — AI analysis
  POST /api/research/sync                          — real-time sync from Semantic Scholar
  POST /api/research/sync/openalex                 — real-time sync from OpenAlex
  GET  /api/research/similar/{paper_id}            — live S2 similar-paper recommendations
  POST /api/research/recommend                     — live S2 recommendations from examples

Legacy prefix /api/research-papers is kept on the same router for
backward compatibility.
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.research_paper_repository import (
    create_research_paper,
    get_research_paper_by_id,
    get_saved_papers,
    is_paper_saved,
    save_paper,
    search_research_papers,
    unsave_paper,
)
from app.schemas.research_paper import (
    ResearchPaperCreate,
    ResearchPaperResponse,
)
from app.services.ai_analysis_service import analyze_paper
from app.services.research_insights_service import generate_research_insights
from app.services.research_recommendations_service import get_recommendations
from app.services.research_trends_service import get_research_trends
from app.services.research_ingestion_service import ResearchIngestionService
from app.services.research_sources.openalex_client import OpenAlexClient
from app.services.research_sources.normalizer import OpenAlexNormalizer
from app.services.research_sources.semantic_scholar_client import SemanticScholarClient
from app.services.research_sources.semantic_scholar_normalizer import SemanticScholarNormalizer
from app.services.semantic_scholar_recommendations import SemanticScholarRecommendationsClient

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(tags=["Research Papers — Module 3"])


def _paper_to_response(paper) -> dict:
    """Serialize a ResearchPaper ORM object to a response dict."""
    authors = paper.get_authors()
    keywords = paper.get_keywords()
    research_areas = paper.get_research_area()
    cached_ai = paper.get_ai_analysis()
    url = paper.open_access_url or paper.source_url

    return {
        "id": paper.id,
        "external_id": paper.external_id,
        "source": paper.source,
        "title": paper.title,
        "abstract": paper.abstract,
        "doi": paper.doi,
        "authors": authors,
        "publication_date": paper.publication_date.isoformat() if paper.publication_date else None,
        "publication_year": paper.publication_year,
        "year": paper.publication_year,
        "journal": paper.journal,
        "venue": paper.journal,
        "keywords": keywords,
        "research_area": research_areas,
        "research_areas": research_areas,
        "source_url": paper.source_url,
        "open_access_url": paper.open_access_url,
        "url": url,
        "ai_analysis": cached_ai,
        "created_at": paper.created_at.isoformat(),
        "updated_at": paper.updated_at.isoformat(),
    }


# ============================================================
# LIST / SEARCH
# ============================================================

@router.get("/api/research/papers", summary="List and search research papers")
@router.get("/api/research-papers", include_in_schema=False)  # legacy compat
def list_research_papers(
    keyword: Optional[str] = Query(None, description="Search in title, abstract, keywords"),
    q: Optional[str] = Query(None, description="Search keyword alias"),
    year: Optional[int] = Query(None, ge=1900, le=2200, description="Filter by publication year"),
    author: Optional[str] = Query(None, description="Filter by author name"),
    research_area: Optional[str] = Query(None, description="Filter by research area"),
    area: Optional[str] = Query(None, description="Research area alias"),
    source: Optional[str] = Query(None, description="Filter by source (openalex, etc.)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Page size alias"),
    sort_by: str = Query("publication_year", description="Sort field: publication_year, year, title, created_at, citations"),
    sort_order: str = Query("desc", description="asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List/search research papers ingested from OpenAlex and other sources.
    All parameters are optional — omit to list all papers.
    """
    effective_keyword = keyword or q
    effective_area = research_area or area
    effective_page_size = limit or page_size

    try:
        papers, total = search_research_papers(
            db=db,
            keyword=effective_keyword,
            year=year,
            author=author,
            research_area=effective_area,
            source=source,
            page=page,
            page_size=effective_page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    total_pages = (total + effective_page_size - 1) // effective_page_size if total > 0 else 0

    return {
        "success": True,
        "data": {
            "items": [_paper_to_response(p) for p in papers],
            "page": page,
            "page_size": effective_page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


# ============================================================
# SAVED PAPERS (must be BEFORE /{paper_id} to avoid routing conflict)
# ============================================================

@router.get("/api/research/papers/saved", summary="Get saved research papers for current user")
def get_my_saved_papers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return only the authenticated user's saved papers."""
    papers, total = get_saved_papers(db, user_id=current_user.id, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "success": True,
        "data": {
            "items": [_paper_to_response(p) for p in papers],
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


# ============================================================
# TRENDS (from real DB data)
# ============================================================

@router.get("/api/research/trends", summary="Research trend analysis from database")
def research_trends(
    domain: Optional[str] = Query(None, description="Filter trends by research domain keyword"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return research trend analytics derived from ingested paper data.

    All metrics are computed from the actual database — nothing is hardcoded.
    """
    trends = get_research_trends(db, domain_filter=domain)
    return {"success": True, "data": trends}


# ============================================================
# RECOMMENDATIONS (profile-based)
# ============================================================

@router.get("/api/research/recommendations", summary="Personalized research recommendations")
def research_recommendations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return research papers recommended based on the authenticated user's
    Module 2 profile (research domain, areas, keywords).

    Changing profile keywords will change the recommendations.
    """
    result = get_recommendations(db, user=current_user, page=page, page_size=page_size)
    return {"success": True, "data": result}


# ============================================================
# PAPER DETAIL
# ============================================================

@router.get("/api/research/papers/{paper_id}", summary="Get research paper details")
@router.get("/api/research-papers/{paper_id}", include_in_schema=False)
def get_research_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full details for a single research paper."""
    paper = get_research_paper_by_id(db, paper_id)
    if paper is None:
        raise HTTPException(status_code=404, detail="Research paper not found.")

    saved = is_paper_saved(db, user_id=current_user.id, paper_id=paper_id)
    data = _paper_to_response(paper)
    data["is_saved"] = saved

    return {"success": True, "data": data}


# ============================================================
# SAVE PAPER
# ============================================================

@router.post("/api/research/papers/{paper_id}/save", summary="Save a research paper", status_code=201)
def save_research_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save a research paper to the authenticated user's saved list.
    Returns 409 if already saved.
    """
    try:
        record, created = save_paper(db, user_id=current_user.id, paper_id=paper_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    if not created:
        raise HTTPException(
            status_code=409,
            detail="Paper is already saved.",
        )

    return {
        "success": True,
        "message": "Paper saved successfully.",
        "data": {"paper_id": paper_id, "saved": True},
    }


@router.delete("/api/research/papers/{paper_id}/save", summary="Unsave a research paper")
def unsave_research_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a paper from the authenticated user's saved list."""
    deleted = unsave_paper(db, user_id=current_user.id, paper_id=paper_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Paper was not saved.")

    return {
        "success": True,
        "message": "Paper removed from saved list.",
        "data": {"paper_id": paper_id, "saved": False},
    }


# ============================================================
# RESEARCH INSIGHTS & RESEARCH GAPS (Multi-paper synthesis)
# ============================================================

@router.get("/api/research/insights", summary="Cross-paper Research Insights & Research Gaps")
def get_insights(
    domain: Optional[str] = Query(None, description="Filter insights by research domain"),
    topic: Optional[str] = Query(None, description="Search topic to synthesize research gaps"),
    limit: int = Query(15, ge=1, le=50, description="Max papers to synthesize"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Synthesize cross-paper Research Insights & Research Gaps.

    Guarantees zero duplicate papers are analyzed (deduplicates by title fingerprint and DOI).
    Extracts:
      - Domain landscape overview
      - Frequently discussed areas & methodologies
      - Observed research gaps with severity ratings
      - Future research directions
      - Downstream technology & patent transfer opportunities
    """
    gemini_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or None
    insights = generate_research_insights(
        db=db,
        domain=domain,
        topic=topic,
        gemini_api_key=gemini_key,
        limit=limit,
    )
    return {"success": True, "data": insights}


# ============================================================
# AI ANALYSIS
# ============================================================

@router.post("/api/research/papers/{paper_id}/analyze", summary="AI analysis of a research paper")
def analyze_research_paper(
    paper_id: int,
    prompt: Optional[str] = Query(None, description="Optional custom focus prompt"),
    force: bool = Query(False, description="Force re-generation instead of using cache"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate structured AI analysis for a research paper.

    Uses only legally available abstract/metadata.
    AI-generated content is clearly labelled in the response.
    Results are cached on the paper record to eliminate duplicate analysis requests.

    Analysis basis:
      - abstract_ai   — Gemini 1.5 Flash / GPT-4o-mini used
      - abstract      — rule-based NLP on abstract
      - metadata_only — no abstract available, analysis limited
    """
    paper = get_research_paper_by_id(db, paper_id)
    if paper is None:
        raise HTTPException(status_code=404, detail="Research paper not found.")

    # Return cached analysis if available and not forced or steered by custom prompt
    if not prompt and not force:
        cached_analysis = paper.get_ai_analysis()
        if cached_analysis:
            return {
                "success": True,
                "cached": True,
                "data": {
                    "source": {
                        "id": paper.id,
                        "title": paper.title,
                        "authors": paper.get_authors(),
                        "publication_year": paper.publication_year,
                        "doi": paper.doi,
                        "source_url": paper.source_url,
                        "abstract": paper.abstract,
                    },
                    "ai_analysis": cached_analysis,
                },
            }

    gemini_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or None
    openai_key = settings.OPENAI_API_KEY if settings.OPENAI_API_KEY else None
    openai_base = getattr(settings, "OPENAI_API_BASE", None) or None

    try:
        ai_result = analyze_paper(
            title=paper.title,
            abstract=paper.abstract,
            authors=paper.get_authors(),
            publication_year=paper.publication_year,
            research_area=paper.get_research_area(),
            keywords=paper.get_keywords(),
            custom_prompt=prompt,
            gemini_api_key=gemini_key,
            openai_api_key=openai_key,
            openai_api_base=openai_base,
        )

        # Cache analysis on paper record to prevent duplicate AI calls
        paper.ai_analysis = json.dumps(ai_result)
        db.commit()
        db.refresh(paper)

    except Exception as exc:
        logger.error("AI analysis failed for paper_id=%d: %s", paper_id, exc)
        raise HTTPException(
            status_code=500,
            detail="AI analysis failed. Please try again later.",
        )

    return {
        "success": True,
        "cached": False,
        "data": {
            "source": {
                "id": paper.id,
                "title": paper.title,
                "authors": paper.get_authors(),
                "publication_year": paper.publication_year,
                "doi": paper.doi,
                "source_url": paper.source_url,
                "abstract": paper.abstract,
            },
            "ai_analysis": ai_result,
        },
    }


# ============================================================
# Legacy POST create endpoint (kept for backward compat)
# ============================================================

@router.post("/api/research-papers", include_in_schema=False)
def create_research_paper_legacy(
    paper: ResearchPaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Legacy create endpoint — kept for backward compatibility."""
    new_paper = create_research_paper(db=db, paper_data=paper.model_dump())
    return {
        "success": True,
        "message": "Research paper created successfully.",
        "data": ResearchPaperResponse.model_validate(new_paper),
    }


# ============================================================
# REAL-TIME SYNC — Semantic Scholar (authenticated)
# ============================================================

@router.post("/api/research/sync", summary="Real-time sync from Semantic Scholar", status_code=202)
def sync_from_semantic_scholar(
    query: str = Query(..., min_length=2, description="Search topic to pull from Semantic Scholar"),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Pull real-time papers from Semantic Scholar into the platform database.

    Uses the configured SEMANTIC_SCHOLAR_API_KEY for authenticated access
    (higher rate limits: 10 req/sec vs. 1 req/sec unauthenticated).

    Returns a sync summary with counts of fetched / inserted / updated / failed records.
    """
    api_key = settings.SEMANTIC_SCHOLAR_API_KEY or None
    client = SemanticScholarClient(api_key=api_key)
    normalizer = SemanticScholarNormalizer()
    svc = ResearchIngestionService(client=client, normalizer=normalizer)

    try:
        summary = svc.run_sync(db=db, query=query, page=page, per_page=per_page)
    except Exception as exc:
        logger.error("Semantic Scholar sync failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"Sync from Semantic Scholar failed: {exc}",
        )

    return {
        "success": True,
        "source": "semantic_scholar",
        "authenticated": bool(api_key),
        "query": query,
        "data": {
            "fetched": summary.fetched,
            "inserted": summary.inserted,
            "updated": summary.updated,
            "skipped_duplicates": summary.skipped_duplicates,
            "failed": summary.failed,
        },
    }


# ============================================================
# REAL-TIME SYNC — OpenAlex (free, polite pool)
# ============================================================

@router.post("/api/research/sync/openalex", summary="Real-time sync from OpenAlex", status_code=202)
def sync_from_openalex(
    query: str = Query(..., min_length=2, description="Search topic to pull from OpenAlex"),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Pull real-time papers from OpenAlex into the platform database.

    OpenAlex is free and open — no API key required. Providing OPENALEX_MAILTO
    in .env enables the polite pool for higher rate limits.

    Returns a sync summary with counts of fetched / inserted / updated / failed records.
    """
    client = OpenAlexClient(mailto=settings.OPENALEX_MAILTO or None)
    normalizer = OpenAlexNormalizer()
    svc = ResearchIngestionService(client=client, normalizer=normalizer)

    try:
        summary = svc.run_sync(db=db, query=query, page=page, per_page=per_page)
    except Exception as exc:
        logger.error("OpenAlex sync failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"Sync from OpenAlex failed: {exc}",
        )

    return {
        "success": True,
        "source": "openalex",
        "authenticated": False,
        "query": query,
        "data": {
            "fetched": summary.fetched,
            "inserted": summary.inserted,
            "updated": summary.updated,
            "skipped_duplicates": summary.skipped_duplicates,
            "failed": summary.failed,
        },
    }


# ============================================================
# LIVE RECOMMENDATIONS — Semantic Scholar Similar Papers
# GET /api/research/similar/{paper_id}
# ============================================================

def _s2_paper_to_dict(raw: dict) -> dict:
    """Convert a raw Semantic Scholar paper dict to a clean response dict."""
    external_ids = raw.get("externalIds") or {}
    oa_pdf = raw.get("openAccessPdf") or {}
    pub_venue = raw.get("publicationVenue") or {}
    journal = raw.get("journal") or {}
    authors = [a.get("name", "") for a in (raw.get("authors") or []) if isinstance(a, dict)]

    return {
        "s2_paper_id": raw.get("paperId"),
        "doi": external_ids.get("DOI"),
        "arxiv_id": external_ids.get("ArXiv"),
        "title": raw.get("title"),
        "abstract": raw.get("abstract"),
        "year": raw.get("year"),
        "publication_date": raw.get("publicationDate"),
        "venue": raw.get("venue") or pub_venue.get("name"),
        "journal_name": journal.get("name"),
        "authors": authors,
        "citation_count": raw.get("citationCount"),
        "influential_citation_count": raw.get("influentialCitationCount"),
        "reference_count": raw.get("referenceCount"),
        "is_open_access": raw.get("isOpenAccess"),
        "open_access_pdf_url": oa_pdf.get("url") if isinstance(oa_pdf, dict) else None,
        "fields_of_study": raw.get("fieldsOfStudy") or [],
        "source_url": raw.get("url"),
        "source": "semantic_scholar_live",
    }


@router.get(
    "/api/research/similar/{s2_paper_id:path}",
    summary="Live similar papers from Semantic Scholar Recommendations API",
)
def get_similar_papers(
    s2_paper_id: str,
    limit: int = Query(20, ge=1, le=100, description="Number of recommendations (max 100)"),
    pool: str = Query("recent", description="'recent' or 'all-cs'"),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch LIVE recommended papers similar to the given paper from the
    Semantic Scholar Recommendations API.

    The ``s2_paper_id`` can be:
    - A 40-character Semantic Scholar paper ID
    - ``DOI:10.1234/example`` (DOI-prefixed)
    - ``ArXiv:2301.00001`` (ArXiv-prefixed)
    - ``DBLP:conf/acl/...`` (DBLP-prefixed)

    Results come directly from Semantic Scholar in real-time — no database
    involved. Papers are ranked by Semantic Scholar's recommendation engine.
    """
    api_key = settings.SEMANTIC_SCHOLAR_API_KEY or None
    client = SemanticScholarRecommendationsClient(api_key=api_key)

    papers = client.recommend_for_paper(
        paper_id=s2_paper_id,
        limit=limit,
        pool=pool,
    )

    if not papers:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No recommendations found for paper '{s2_paper_id}'. "
                "Ensure it is a valid Semantic Scholar paper ID or a prefixed "
                "external ID (e.g. DOI:10.x/y, ArXiv:2301.xxxxx)."
            ),
        )

    return {
        "success": True,
        "source": "semantic_scholar_recommendations_live",
        "input_paper_id": s2_paper_id,
        "pool": pool,
        "data": {
            "total": len(papers),
            "items": [_s2_paper_to_dict(p) for p in papers],
        },
    }


# ============================================================
# LIVE RECOMMENDATIONS — From Positive/Negative Examples
# POST /api/research/recommend
# ============================================================

@router.post(
    "/api/research/recommend",
    summary="Live recommendations from Semantic Scholar based on example paper IDs",
    status_code=200,
)
def recommend_from_examples(
    positive_ids: list[str] = Query(
        ...,
        description="Comma-separated Semantic Scholar paper IDs you like",
    ),
    negative_ids: list[str] = Query(
        default=[],
        description="Comma-separated paper IDs you are NOT interested in",
    ),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """
    Get LIVE personalized paper recommendations using the Semantic Scholar
    Recommendations API's positive/negative example matching.

    Provide a list of paper IDs you are interested in (``positive_ids``)
    and optionally IDs of papers you want to exclude (``negative_ids``).
    Semantic Scholar's algorithm returns papers that are similar to your
    positive examples but different from your negative ones.

    Paper IDs can be:
    - 40-char Semantic Scholar IDs
    - Prefixed: ``DOI:10.x/y``, ``ArXiv:2301.xxxxx``, ``DBLP:...``
    """
    if not positive_ids:
        raise HTTPException(
            status_code=422,
            detail="At least one positive_ids entry is required.",
        )

    api_key = settings.SEMANTIC_SCHOLAR_API_KEY or None
    client = SemanticScholarRecommendationsClient(api_key=api_key)

    papers = client.recommend_from_examples(
        positive_ids=positive_ids,
        negative_ids=negative_ids or [],
        limit=limit,
    )

    if not papers:
        raise HTTPException(
            status_code=404,
            detail=(
                "No recommendations found. Verify that the provided paper IDs "
                "are valid Semantic Scholar IDs or prefixed external IDs."
            ),
        )

    return {
        "success": True,
        "source": "semantic_scholar_recommendations_live",
        "inputs": {
            "positive_ids": positive_ids,
            "negative_ids": negative_ids or [],
        },
        "data": {
            "total": len(papers),
            "items": [_s2_paper_to_dict(p) for p in papers],
        },
    }


# ============================================================
# HELPER — Get S2 Paper ID for a local DB paper
# GET /api/research/papers/{paper_id}/s2-id
# ============================================================

@router.get(
    "/api/research/papers/{paper_id}/s2-id",
    summary="Resolve Semantic Scholar paper ID for a local paper",
)
def resolve_s2_paper_id(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the Semantic Scholar paper ID (or DOI/ArXiv ID) for a local
    database paper, so it can be used with the /api/research/similar endpoint.

    If the paper was ingested from Semantic Scholar, its external_id is
    the native S2 ID. If from another source (e.g. OpenAlex), the DOI
    is returned as ``DOI:10.xxxx/...``.
    """
    paper = get_research_paper_by_id(db, paper_id)
    if paper is None:
        raise HTTPException(status_code=404, detail="Research paper not found.")

    s2_id: str | None = None
    doi_id: str | None = None

    if paper.source == "semantic_scholar" and paper.external_id:
        s2_id = paper.external_id
    if paper.doi:
        doi_id = f"DOI:{paper.doi}"

    if not s2_id and not doi_id:
        raise HTTPException(
            status_code=404,
            detail=(
                "No Semantic Scholar-compatible ID found for this paper. "
                "It may not have a DOI or a Semantic Scholar external ID."
            ),
        )

    return {
        "success": True,
        "data": {
            "local_paper_id": paper_id,
            "title": paper.title,
            "s2_paper_id": s2_id,
            "doi_prefixed_id": doi_id,
            "recommended_id": s2_id or doi_id,
            "similar_papers_url": f"/api/research/similar/{s2_id or doi_id}",
        },
    }