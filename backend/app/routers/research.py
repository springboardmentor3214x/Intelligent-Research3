"""
FastAPI Research Intelligence API Router (Module 3 & Cross-Module Research Layer)
Exposes unified multi-provider search, DOI resolution, bibliometric trends, and profile recommendations.
"""
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, status

from app.services.research.search_service import research_search_service
from app.services.research.schemas import (
    SearchResponse,
    TrendsResponse,
    NormalizedPaper,
    ProviderStatusList,
)

router = APIRouter(prefix="/api/research", tags=["research-intelligence"])


@router.get("/search", response_model=SearchResponse)
async def search_research_papers(
    q: str = Query(..., description="Query terms or keywords"),
    sources: Optional[str] = Query(None, description="Comma-separated providers e.g. openalex,semantic_scholar,crossref,core,serpapi"),
    limit: int = Query(15, ge=1, le=50, description="Max papers to return"),
    year_min: Optional[int] = Query(None, description="Filter: minimum publication year"),
    year_max: Optional[int] = Query(None, description="Filter: maximum publication year"),
):
    """
    Search academic literature across OpenAlex, Semantic Scholar, Crossref, CORE, and Google Scholar.
    Automatically normalizes, reconciles provenance, and deduplicates identical records.
    """
    source_list = [s.strip() for s in sources.split(",") if s.strip()] if sources else ["all"]
    return await research_search_service.search_papers(
        query=q,
        sources=source_list,
        limit=limit,
        year_min=year_min,
        year_max=year_max,
    )


@router.get("/providers/status", response_model=ProviderStatusList)
async def get_providers_status():
    """
    Inspect real-time health, rate limits, and configuration status of all research API providers.
    """
    return research_search_service.get_providers_status()


@router.get("/trends", response_model=TrendsResponse)
async def get_publication_trends(
    domain: str = Query("Artificial Intelligence", description="Research domain or technology topic"),
    years: int = Query(5, ge=2, le=10, description="Time window in years"),
):
    """
    Empirical publication velocity, topic evolution, and citation metrics computed across real indexed literature.
    """
    return await research_search_service.calculate_trends(domain=domain, years=years)


@router.get("/recommendations", response_model=List[NormalizedPaper])
async def get_profile_recommendations(
    domain: Optional[str] = Query(None, description="Primary research domain from Module 2"),
    areas: Optional[str] = Query(None, description="Comma-separated research areas from Module 2"),
    keywords: Optional[str] = Query(None, description="Comma-separated keywords from Module 2"),
    limit: int = Query(8, ge=1, le=20),
):
    """
    Module 2 User Interests Integration: Recommends relevant breakthrough papers
    using active researcher profile parameters.
    """
    areas_list = [a.strip() for a in areas.split(",") if a.strip()] if areas else []
    keywords_list = [k.strip() for k in keywords.split(",") if k.strip()] if keywords else []

    return await research_search_service.get_recommendations_for_profile(
        domain=domain or "Artificial Intelligence",
        keywords=keywords_list,
        areas=areas_list,
        limit=limit,
    )


@router.get("/doi/{doi:path}", response_model=NormalizedPaper)
async def get_paper_by_doi(doi: str):
    """
    Resolves canonical research publication record across Crossref, Semantic Scholar, and OpenAlex.
    """
    paper = await research_search_service.get_paper_by_doi(doi)
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No publication found matching DOI '{doi}' across configured providers.",
        )
    return paper
