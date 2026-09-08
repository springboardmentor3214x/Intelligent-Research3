"""
backend/app/schemas/funding.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Pydantic v2 schemas for FundingOpportunity.

Schema hierarchy:
  FundingOpportunityBase      — shared fields (no id / timestamps)
  FundingOpportunityCreate    — used by the normalizer when inserting new records
  FundingOpportunityUpdate    — used by the sync job when refreshing existing records
  FundingOpportunityRead      — returned by API endpoints (includes id + timestamps)
  FundingOpportunityListResponse — paginated list envelope (Member 5 uses this shape)

All schemas use `model_config = ConfigDict(from_attributes=True)` so they can be
constructed directly from SQLAlchemy ORM objects.
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


# ── Shared base ───────────────────────────────────────────────────────────────

class FundingOpportunityBase(BaseModel):
    """Fields shared by Create, Update, and Read schemas."""

    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., min_length=1, max_length=1024, description="Grant title")
    organization: str = Field(
        default="", max_length=512, description="Funding organisation name"
    )
    description: str | None = Field(
        default=None, description="Full opportunity description / abstract"
    )
    funding_amount: Decimal | None = Field(
        default=None, ge=0, description="Award amount (Decimal)"
    )
    currency: str = Field(
        default="USD", max_length=8, description="ISO-4217 currency code"
    )
    deadline: datetime | None = Field(
        default=None, description="Application deadline (UTC)"
    )
    eligibility: str | None = Field(
        default=None, description="Eligibility criteria (free text)"
    )
    research_areas: list[str] = Field(
        default_factory=list, description="Normalised research area labels"
    )
    keywords: list[str] = Field(
        default_factory=list, description="Keywords from source"
    )
    funding_type: Literal["grant", "fellowship", "contract", "other"] = Field(
        default="grant", description="Funding category"
    )
    country: str = Field(
        default="US", max_length=4, description="ISO-3166-1 alpha-2 country code"
    )
    source_url: str | None = Field(
        default=None, max_length=2048, description="Link to source record"
    )
    application_url: str | None = Field(
        default=None, max_length=2048, description="Direct application URL"
    )
    status: Literal["active", "expired", "closed"] = Field(
        default="active", description="Opportunity lifecycle status"
    )

    @field_validator("research_areas", "keywords", mode="before")
    @classmethod
    def coerce_to_list(cls, v: object) -> list:
        """Accept None or a string and coerce to list."""
        if v is None:
            return []
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v


# ── Create schema (used by normalizer + ingestion service) ───────────────────

class FundingOpportunityCreate(FundingOpportunityBase):
    """
    Input schema for inserting a new FundingOpportunity.
    Includes `external_id` and `source` which together form the deduplication key.
    """

    external_id: str = Field(
        ..., min_length=1, max_length=512, description="Source-specific ID"
    )
    source: Literal["nih_reporter", "grants_gov"] = Field(
        ..., description="Source identifier"
    )


# ── Update schema (used by sync job when refreshing existing records) ─────────

class FundingOpportunityUpdate(BaseModel):
    """
    Partial update schema.  All fields are optional so only changed fields
    need to be supplied by the sync job.
    """

    model_config = ConfigDict(from_attributes=True)

    title: str | None = None
    organization: str | None = None
    description: str | None = None
    funding_amount: Decimal | None = None
    currency: str | None = None
    deadline: datetime | None = None
    eligibility: str | None = None
    research_areas: list[str] | None = None
    keywords: list[str] | None = None
    funding_type: str | None = None
    country: str | None = None
    source_url: str | None = None
    application_url: str | None = None
    status: str | None = None


# ── Read schema (returned by API to frontend / Member 5) ─────────────────────

class FundingOpportunityRead(FundingOpportunityBase):
    """
    Full read schema — includes server-assigned `id` and audit timestamps.

    Member 5 (Module 4 Search & FastAPI) and Member 6 (AI Matching + Frontend)
    use this as the stable API response shape.
    """

    id: int
    external_id: str
    source: str
    created_at: datetime
    updated_at: datetime


# ── Paginated list envelope ───────────────────────────────────────────────────

class FundingOpportunityListResponse(BaseModel):
    """
    Standard paginated response envelope.

    Matches the project-wide pagination contract:
        { items, page, page_size, total }
    """

    items: list[FundingOpportunityRead]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total: int = Field(ge=0)


# ── Ingestion summary (returned by sync job / CLI) ────────────────────────────

class IngestionSummary(BaseModel):
    """Result summary returned after a sync run."""

    source: str
    fetched: int = 0
    inserted: int = 0
    updated: int = 0
    skipped_duplicates: int = 0
    skipped_malformed: int = 0
    errors: list[str] = Field(default_factory=list)
