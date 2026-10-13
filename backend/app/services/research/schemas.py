"""
Unified Research Integration Data Schemas
Implements canonical models for papers, searches, trends, and provider status.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class NormalizedPaper(BaseModel):
    id: str = Field(description="Deterministic internal ID e.g. paper-{source}-{id}")
    external_id: str = Field(description="External provider identifier")
    source: str = Field(description="Source provider name e.g. OpenAlex, Semantic Scholar, Crossref, CORE, Google Scholar")
    title: str = Field(description="Normalized paper title")
    authors: List[str] = Field(default_factory=list, description="List of author full names")
    abstract: Optional[str] = Field(default=None, description="Paper abstract text where permitted/available")
    publication_date: Optional[str] = Field(default=None, description="Publication date (YYYY-MM-DD or YYYY)")
    publication_year: Optional[int] = Field(default=None, description="Calendar year of publication")
    journal: Optional[str] = Field(default=None, description="Publishing journal name")
    conference: Optional[str] = Field(default=None, description="Conference proceedings or venue name")
    doi: Optional[str] = Field(default=None, description="Standardized DOI e.g. 10.1109/...")
    paper_url: Optional[str] = Field(default=None, description="Canonical link to the paper")
    open_access_url: Optional[str] = Field(default=None, description="Direct Open Access PDF or repository link")
    is_open_access: bool = Field(default=False, description="Whether paper is Open Access")
    keywords: List[str] = Field(default_factory=list, description="Associated topics, concepts or keywords")
    citation_count: Optional[int] = Field(default=None, description="Reported citation count")
    reference_count: Optional[int] = Field(default=None, description="Reported reference count")
    retrieved_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    provenance: Dict[str, Any] = Field(default_factory=dict, description="Metadata sources and merging trace")


class SearchRequest(BaseModel):
    query: str
    sources: List[str] = Field(default=["all"])
    limit: int = Field(default=15, ge=1, le=50)
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    domain: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    total_results: int
    sources_queried: List[str]
    sources_succeeded: List[str]
    sources_failed: List[str]
    execution_time_ms: float
    papers: List[NormalizedPaper]


class TopicTrend(BaseModel):
    topic: str
    count: int
    growth_rate: Optional[float] = None


class TrendsResponse(BaseModel):
    domain: str
    analysis_period: str
    total_publications_analyzed: int
    year_distribution: Dict[str, int]
    top_topics: List[TopicTrend]
    citations_by_year: Dict[str, int]
    open_access_ratio: float
    data_sources: List[str]
    retrieved_timestamp: str
    methodology: str


class ProviderStatus(BaseModel):
    provider_id: str
    name: str
    is_configured: bool
    requires_key: bool
    status: str  # "operational", "unconfigured", "error"
    features: List[str]
    rate_limit_info: str
    last_error: Optional[str] = None


class ProviderStatusList(BaseModel):
    providers: List[ProviderStatus]
    active_providers_count: int
    total_providers_count: int
