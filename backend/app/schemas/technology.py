"""
Module 6 – Pydantic schemas for Technology Intelligence API.
"""
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


# ─── Yearly Metric ──────────────────────────────────────────────────────────

class YearlyMetric(BaseModel):
    year: int
    research_papers: int | None = None
    patents: int | None = None
    organizations: int | None = None
    applications: int | None = None
    adoption_rate: float | None = None
    citations: int | None = None
    source: str | None = None
    is_demo: bool = False
    last_updated: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ─── Trend ──────────────────────────────────────────────────────────────────

class TrendOut(BaseModel):
    research_growth: float | None = None
    patent_growth: float | None = None
    research_direction: str | None = None
    patent_direction: str | None = None
    organization_direction: str | None = None
    application_direction: str | None = None
    research_slope: float | None = None
    patent_slope: float | None = None
    confidence: float | None = None
    years_analysed: int | None = None
    yearly_research_growth: dict | None = None
    yearly_patent_growth: dict | None = None
    calculated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# ─── Maturity ────────────────────────────────────────────────────────────────

class MaturityIndicators(BaseModel):
    researchGrowth: float | None = None
    patentGrowth: float | None = None
    researchActivity: float | None = None
    patentActivity: float | None = None
    organizationParticipation: float | None = None
    applicationDiversity: float | None = None


class MaturityWeights(BaseModel):
    researchGrowth: float = 0.25
    patentGrowth: float = 0.25
    researchActivity: float = 0.15
    patentActivity: float = 0.15
    organizationParticipation: float = 0.10
    applicationDiversity: float = 0.10


class AdoptionOut(BaseModel):
    level: str  # "Low" | "Medium" | "High" | "Insufficient Data"
    trend: str  # "Increasing" | "Stable" | "Decreasing" | "Insufficient Data"


class ExplanationOut(BaseModel):
    summary: str
    evidence: list[str] = []
    limitations: list[str] = []


class MaturityOut(BaseModel):
    technology_id: str
    stage: str
    score: float | None = None
    indicators: MaturityIndicators
    weights: MaturityWeights = MaturityWeights()
    adoption: AdoptionOut | None = None
    confidence: float | None = None
    explanation: ExplanationOut | None = None
    methodology_version: str = "maturity_v1"
    calculated_at: datetime | None = None


# ─── Technology ──────────────────────────────────────────────────────────────

class TechnologyOut(BaseModel):
    id: int
    technology_id: str
    name: str
    domain: str | None = None
    description: str | None = None
    keywords: list | None = None
    related_technologies: list | None = None
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime
    # Embedded summaries
    stage: str | None = None
    score: float | None = None
    adoption_level: str | None = None
    research_direction: str | None = None
    patent_direction: str | None = None
    confidence: float | None = None

    model_config = ConfigDict(from_attributes=True)


class TechnologyListOut(BaseModel):
    technologies: list[TechnologyOut]
    total: int
    data_mode: str  # "live" | "cached" | "demo"


# ─── Opportunity ─────────────────────────────────────────────────────────────

class OpportunityOut(BaseModel):
    id: int
    technology_id: str
    technology_name: str
    opportunity_type: str
    title: str
    description: str | None = None
    signals: list | None = None
    confidence: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Competitor ──────────────────────────────────────────────────────────────

class CompetitorOut(BaseModel):
    id: int
    organization_name: str
    research_count: int | None = None
    patent_count: int | None = None
    research_trend: str | None = None
    patent_trend: str | None = None
    applications: list | None = None
    year: int | None = None
    source: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ─── Data Source ─────────────────────────────────────────────────────────────

class DataSourceStatusOut(BaseModel):
    source_name: str
    status: str
    records_fetched: int | None = None
    last_updated: datetime | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ─── Sync ────────────────────────────────────────────────────────────────────

class SyncRequest(BaseModel):
    technology_names: list[str] = Field(
        default=["Quantum Computing", "Large Language Models", "Edge AI"],
        description="Technology names to ingest from external APIs"
    )
    use_demo_fallback: bool = Field(
        default=True,
        description="If True, use demo data when external APIs are unavailable"
    )


class SyncResponse(BaseModel):
    technologies_processed: int
    sources_queried: list[str]
    status: str
    message: str
    data_sources: list[DataSourceStatusOut]
