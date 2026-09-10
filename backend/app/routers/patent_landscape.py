"""
Patent Landscape Router — Module 5.

Provides clean REST endpoints for:
  - Real Patent Search & Filtering
  - Patent Details
  - Provider Sync / Ingestion
  - Patent Trend Analysis (Year -> Count)
  - Competitor Patent Analysis (Assignee activity)
  - Patent Clustering (Sentence Transformers + KMeans)
  - Innovation Mapping (Domain -> Classification -> Assignee)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import distinct
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.patent_landscape import PatentRecord
from app.schemas.patent import (
    CompetitorResponse,
    InnovationMapResponse,
    PatentClusterRequest,
    PatentClustersResponse,
    PatentPaginatedResponse,
    PatentRecordOut,
    PatentSyncSummary,
    PatentTrendResponse,
)
from app.services.patent_landscape_service import patent_landscape_service

router = APIRouter(
    prefix="/api/patent-landscape",
    tags=["Module 5 — Patent Landscape Analysis"],
)


@router.get("/search", response_model=PatentPaginatedResponse)
def search_patents(
    q: Optional[str] = Query(None, description="Search keyword in title, abstract, or number"),
    assignee: Optional[str] = Query(None, description="Filter by assignee name"),
    domain: Optional[str] = Query(None, description="Filter by technology domain"),
    classification: Optional[str] = Query(None, description="Filter by patent classification (IPC/CPC)"),
    year_min: Optional[int] = Query(None, description="Minimum filing year"),
    year_max: Optional[int] = Query(None, description="Maximum filing year"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("filing_date", pattern="^(filing_date|citation_count|title|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    """
    Search and filter real patent records with pagination.
    """
    return patent_landscape_service.search_patents(
        db=db,
        keyword=q,
        assignee=assignee,
        domain=domain,
        classification=classification,
        filing_year_min=year_min,
        filing_year_max=year_max,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/trends", response_model=PatentTrendResponse)
def get_patent_trends(
    domain: Optional[str] = Query(None, description="Filter trends by technology domain"),
    assignee: Optional[str] = Query(None, description="Filter trends by assignee"),
    q: Optional[str] = Query(None, description="Filter trends by keyword"),
    db: Session = Depends(get_db),
):
    """
    Analyze real patent filing activity over time (Filing Year -> Patent Count).
    """
    return patent_landscape_service.get_trends(
        db=db,
        domain=domain,
        assignee=assignee,
        query=q,
    )


@router.get("/competitors", response_model=CompetitorResponse)
def get_competitors(
    domain: Optional[str] = Query(None, description="Filter competitors by technology domain"),
    q: Optional[str] = Query(None, description="Filter competitors by search term"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Identify organizations/companies owning patents in the selected area and their activity.
    """
    return patent_landscape_service.get_competitor_analysis(
        db=db,
        domain=domain,
        query=q,
        limit=limit,
    )


@router.get("/innovation-map", response_model=InnovationMapResponse)
def get_innovation_map(
    domain: Optional[str] = Query(None, description="Filter by specific domain"),
    db: Session = Depends(get_db),
):
    """
    Generate innovation mapping data connecting Technology Domain -> Classification -> Assignee.
    """
    return patent_landscape_service.get_innovation_map(
        db=db,
        domain_filter=domain,
    )


@router.post("/cluster", response_model=PatentClustersResponse)
def cluster_patents(
    payload: Optional[PatentClusterRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Run semantic clustering on available patent records using Sentence Transformers + KMeans.
    """
    n_clusters = payload.n_clusters if payload else 5
    domain_filter = payload.domain_filter if payload else None
    min_patents = payload.min_patents if payload else 5

    return patent_landscape_service.run_clustering(
        db=db,
        n_clusters=n_clusters,
        domain_filter=domain_filter,
        min_patents=min_patents,
    )


@router.get("/clusters", response_model=PatentClustersResponse)
def get_clusters(
    domain: Optional[str] = Query(None),
    n_clusters: int = Query(5, ge=2, le=20),
    db: Session = Depends(get_db),
):
    """
    GET shortcut to cluster available patent records.
    """
    return patent_landscape_service.run_clustering(
        db=db,
        n_clusters=n_clusters,
        domain_filter=domain,
    )


@router.post("/sync", response_model=PatentSyncSummary)
def sync_patents(
    query: str = Query(..., description="Keyword query to fetch from external provider"),
    source: Optional[str] = Query(None, description="Provider: 'uspto' or 'lens'"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Trigger ingestion of real patent data from configured external provider.
    """
    return patent_landscape_service.sync_from_source(
        db=db,
        query=query,
        source=source,
        limit=limit,
    )


@router.get("/domains", response_model=list[str])
def list_available_domains(db: Session = Depends(get_db)):
    """
    Return distinct technology domains present in current patent records.
    """
    rows = (
        db.query(distinct(PatentRecord.technology_domain))
        .filter(PatentRecord.technology_domain.isnot(None))
        .order_by(PatentRecord.technology_domain.asc())
        .all()
    )
    return [r[0] for r in rows if r[0]]


@router.get("/{patent_id}", response_model=PatentRecordOut)
def get_patent_detail(patent_id: int, db: Session = Depends(get_db)):
    """
    Get full details for a single patent record.
    """
    patent = patent_landscape_service.get_patent(db=db, patent_id=patent_id)
    if not patent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patent record not found",
        )
    return patent
