"""
Pydantic schemas for FundingOpportunity — Module 4.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class FundingOpportunityBase(BaseModel):
    external_id: str | None = None
    source: str = "grants_gov"
    title: str = Field(..., min_length=1, max_length=1000)
    organization: str | None = Field(default=None, max_length=500)
    description: str | None = None
    funding_amount: float | None = None
    funding_amount_min: float | None = None
    funding_amount_max: float | None = None
    currency: str = "USD"
    deadline: date | None = None
    status: str = "open"
    funding_type: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=120)
    research_areas: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    eligibility: str | None = None
    source_url: str | None = Field(default=None, max_length=2000)
    application_url: str | None = Field(default=None, max_length=2000)


class FundingOpportunityCreate(FundingOpportunityBase):
    """Schema used during ingestion."""
    pass


class FundingOpportunityOut(FundingOpportunityBase):
    """Schema returned when reading a funding opportunity."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title_fingerprint: str | None = None
    org_fingerprint: str | None = None
    created_at: datetime
    updated_at: datetime


class FundingSearchRequest(BaseModel):
    """POST /api/funding/search request body."""
    query: str | None = None
    research_area: str | None = None
    organization: str | None = None
    funding_type: str | None = None
    country: str | None = None
    amount_min: float | None = None
    amount_max: float | None = None
    deadline_from: date | None = None
    deadline_to: date | None = None
    status: str | None = "open"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = "deadline"
    sort_order: str = "asc"


class FundingMatchRequest(BaseModel):
    """POST /api/funding/match request body."""
    research_domain: str | None = None
    research_areas: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    funding_id: int


class FundingMatchResponse(BaseModel):
    """Match score + reasons for a single funding opportunity."""
    funding_id: int
    match_score: float = Field(ge=0.0, le=1.0)
    matched_areas: list[str]
    matched_keywords: list[str]
    reasons: list[str]
    eligibility_flags: list[str]


class FundingSyncSummary(BaseModel):
    """Summary returned after a funding sync run."""
    fetched: int = 0
    inserted: int = 0
    updated: int = 0
    skipped_duplicates: int = 0
    failed: int = 0
