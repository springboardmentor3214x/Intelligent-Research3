"""
Pydantic schemas for PatentRecord — Module 5 Patent Landscape Analysis.
"""

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PatentRecordBase(BaseModel):
    """Shared fields between create, update, and read schemas."""
    source: str = "uspto"
    source_patent_id: Optional[str] = None
    patent_number: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=2000)
    abstract: Optional[str] = None
    assignee: Optional[str] = Field(default=None, max_length=500)
    assignee_normalized: Optional[str] = Field(default=None, max_length=500)
    inventors: list[str] = Field(default_factory=list)
    filing_date: Optional[date] = None
    publication_date: Optional[date] = None
    grant_date: Optional[date] = None
    filing_year: Optional[int] = Field(default=None, ge=1800, le=2200)
    country: Optional[str] = Field(default=None, max_length=10)
    patent_classification: Optional[str] = Field(default=None, max_length=500)
    all_classifications: list[str] = Field(default_factory=list)
    technology_domain: Optional[str] = Field(default=None, max_length=255)
    keywords: list[str] = Field(default_factory=list)
    citation_count: Optional[int] = Field(default=None, ge=0)
    claims_text: Optional[str] = None
    description_text: Optional[str] = None
    source_url: Optional[str] = Field(default=None, max_length=2000)
    raw_metadata: Optional[dict[str, Any]] = None

    @field_validator("inventors", "all_classifications", "keywords", mode="before")
    @classmethod
    def parse_json_list(cls, v: Any) -> list[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return [str(item) for item in v]
        if isinstance(v, str):
            try:
                import json
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except Exception:
                pass
            return [v]
        return []

    @field_validator("raw_metadata", mode="before")
    @classmethod
    def parse_json_dict(cls, v: Any) -> Optional[dict[str, Any]]:
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                import json
                parsed = json.loads(v)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                return None
        return None


class PatentRecordCreate(PatentRecordBase):
    """Schema used during ingestion to create/upsert a patent record."""
    pass


class PatentRecordOut(PatentRecordBase):
    """Schema returned when reading a patent record via API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    cluster_id: Optional[int] = None
    cluster_label: Optional[str] = None
    title_fingerprint: Optional[str] = None
    assignee_fingerprint: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PatentPaginatedResponse(BaseModel):
    """Standard paginated response for patent search."""
    items: list[PatentRecordOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class PatentSyncSummary(BaseModel):
    """Summary returned after a sync/ingest run."""
    source: str = "uspto"
    query: Optional[str] = None
    fetched: int = 0
    inserted: int = 0
    updated: int = 0
    skipped_duplicates: int = 0
    failed: int = 0


class PatentClusterRequest(BaseModel):
    """Request body for triggering a clustering run."""
    n_clusters: int = Field(default=5, ge=2, le=30, description="Number of clusters for KMeans")
    algorithm: str = Field(default="kmeans", description="Clustering algorithm: 'kmeans'")
    domain_filter: Optional[str] = Field(default=None, description="Restrict clustering to a specific domain")
    min_patents: int = Field(default=5, description="Minimum patents required to run clustering")


class RepresentativePatent(BaseModel):
    id: int
    patent_number: Optional[str] = None
    title: str
    assignee: Optional[str] = None
    filing_date: Optional[date] = None
    patent_classification: Optional[str] = None
    technology_domain: Optional[str] = None
    citation_count: Optional[int] = None
    source_url: Optional[str] = None


class PatentClusterOut(BaseModel):
    """A single patent cluster result."""
    cluster_id: int
    label: str
    patent_count: int
    top_keywords: list[str] = Field(default_factory=list)
    dominant_classification: Optional[str] = None
    dominant_domain: Optional[str] = None
    top_assignees: list[str] = Field(default_factory=list)
    representative_patents: list[RepresentativePatent] = Field(default_factory=list)


class PatentClustersResponse(BaseModel):
    """Response containing all clusters."""
    status: str
    total_records_clustered: int
    clusters: list[PatentClusterOut]
    message: Optional[str] = None


class PatentTrendPoint(BaseModel):
    """Filing trend count for a single year."""
    year: int
    count: int


class PatentTrendResponse(BaseModel):
    """Filing trends over time."""
    trends: list[PatentTrendPoint]
    total_patents: int
    start_year: Optional[int] = None
    end_year: Optional[int] = None


class CompetitorFilingPoint(BaseModel):
    year: int
    count: int


class CompetitorDomainShare(BaseModel):
    domain: str
    count: int


class CompetitorItem(BaseModel):
    """Competitor / Assignee analysis item."""
    assignee: str
    patent_count: int
    citation_count: int
    filing_timeline: list[CompetitorFilingPoint] = Field(default_factory=list)
    domain_distribution: list[CompetitorDomainShare] = Field(default_factory=list)
    primary_classification: Optional[str] = None


class CompetitorResponse(BaseModel):
    competitors: list[CompetitorItem]
    total_assignees: int


class DomainClassificationNode(BaseModel):
    classification: str
    count: int


class DomainAssigneeNode(BaseModel):
    assignee: str
    count: int


class InnovationDomainNode(BaseModel):
    domain: str
    patent_count: int
    top_classifications: list[DomainClassificationNode]
    top_assignees: list[DomainAssigneeNode]


class InnovationMapResponse(BaseModel):
    """Innovation mapping data connecting Domains -> Classifications -> Assignees."""
    domains: list[InnovationDomainNode]
    total_patents: int
    total_domains: int
