"""
Pydantic schemas for ResearchPaper — Module 3.

These schemas are used:
  - Internally for validation during ingestion
  - By Member 2 to query/read ingested papers via API
"""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ResearchPaperBase(BaseModel):
    external_id: str | None = None
    source: str = "openalex"
    title: str = Field(..., min_length=1, max_length=1000)
    abstract: str | None = None
    doi: str | None = Field(default=None, max_length=500)
    authors: list[str] = Field(default_factory=list)
    publication_date: date | None = None
    publication_year: int | None = Field(default=None, ge=1000, le=2200)
    journal: str | None = Field(default=None, max_length=500)
    keywords: list[str] = Field(default_factory=list)
    research_area: list[str] = Field(default_factory=list)
    source_url: str | None = Field(default=None, max_length=2000)
    open_access_url: str | None = Field(default=None, max_length=2000)


class ResearchPaperCreate(ResearchPaperBase):
    """Schema used during ingestion to create a new record."""
    pass


class ResearchPaperUpdate(BaseModel):
    """Schema used during upsert to update an existing record. All fields optional."""
    abstract: str | None = None
    doi: str | None = None
    authors: list[str] | None = None
    publication_date: date | None = None
    publication_year: int | None = None
    journal: str | None = None
    keywords: list[str] | None = None
    research_area: list[str] | None = None
    source_url: str | None = None
    open_access_url: str | None = None


class ResearchPaperOut(ResearchPaperBase):
    """Schema returned when reading a paper (for Member 2)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    normalized_doi: str | None = None
    created_at: datetime
    updated_at: datetime


class SyncSummary(BaseModel):
    """Summary returned after a sync run."""
    fetched: int = 0
    inserted: int = 0
    updated: int = 0
    skipped_duplicates: int = 0
    failed: int = 0
