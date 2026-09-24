"""
backend/app/schemas/module7_member4.py
Author: Member 4

Pydantic v2 schemas for Module 7 - Member 4:
- Technology Maturity (15%)
- Market Potential (20%)
- Funding Relevance (15%)
"""

from typing import Dict, Optional, List, Any
from pydantic import BaseModel, Field, ValidationInfo, field_validator


class TechnologyMaturityResponse(BaseModel):
    """Schema for Technology Maturity factor output (15% weight in Module 7)."""
    technology_id: str = Field(..., json_schema_extra={"example": "TECH001"}, description="Unique technology identifier")
    stage: str = Field(..., json_schema_extra={"example": "Developing"}, description="Maturity stage: Emerging, Developing, Mature, or Declining")
    score: float = Field(..., ge=0.0, le=100.0, json_schema_extra={"example": 67.0}, description="Normalized maturity score (0-100)")
    adoption: float = Field(..., ge=0.0, le=100.0, json_schema_extra={"example": 28.0}, description="Separate adoption score (0-100)")
    confidence: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"example": 0.81}, description="Confidence metric (0.0-1.0)")
    factor_weight: float = Field(default=0.15, description="Module 7 factor weight (15%)")
    weighted_contribution: Optional[float] = Field(default=None, description="Calculated weighted contribution to final score")

    @field_validator("weighted_contribution", mode="before")
    @classmethod
    def set_weighted_contribution(cls, v: Optional[float], info: ValidationInfo) -> float:
        if v is not None:
            return v
        score = info.data.get("score", 0.0)
        weight = info.data.get("factor_weight", 0.15)
        return round(score * weight, 2)


class MarketPotentialInput(BaseModel):
    """Input indicators for Market Potential calculation (0-100 scale each)."""
    applicationBreadth: float = Field(..., ge=0.0, le=100.0, description="Breadth of potential applications (25% weight)")
    industryRelevance: float = Field(..., ge=0.0, le=100.0, description="Relevance to key industries (20% weight)")
    demandSignals: float = Field(..., ge=0.0, le=100.0, description="Market demand signals from public/approved datasets (20% weight)")
    organizationBreadth: float = Field(..., ge=0.0, le=100.0, description="Number of organizations investigating/using (15% weight)")
    applicationGrowth: float = Field(..., ge=0.0, le=100.0, description="Multi-year growth in applications (20% weight)")


class MarketPotentialResponse(BaseModel):
    """Schema for Market Potential factor output (20% weight in Module 7)."""
    technology_id: str = Field(..., example="TECH001")
    score: float = Field(..., ge=0.0, le=100.0, example=76.0, description="Market potential score (0-100)")
    factor_weight: float = Field(default=0.20, description="Module 7 factor weight (20%)")
    weighted_contribution: float = Field(..., description="Contribution to final innovation score")
    indicators: Dict[str, float] = Field(..., description="Normalized breakdown of constituent indicators")


class FundingRelevanceInput(BaseModel):
    """Input indicators for Funding Relevance calculation (0-100 scale each)."""
    opportunityCount: float = Field(..., ge=0.0, le=100.0, description="Count of relevant funding opportunities (25% weight)")
    relevance: float = Field(..., ge=0.0, le=100.0, description="Relevance match score (30% weight)")
    eligibilityMatch: float = Field(..., ge=0.0, le=100.0, description="Researcher/Org eligibility match (25% weight)")
    programActivity: float = Field(..., ge=0.0, le=100.0, description="Funder program activity in this field (20% weight)")


class FundingRelevanceResponse(BaseModel):
    """Schema for Funding Relevance factor output (15% weight in Module 7)."""
    technology_id: str = Field(..., example="TECH001")
    score: float = Field(..., ge=0.0, le=100.0, example=70.0, description="Funding relevance score (0-100)")
    factor_weight: float = Field(default=0.15, description="Module 7 factor weight (15%)")
    weighted_contribution: float = Field(..., description="Contribution to final innovation score")
    indicators: Dict[str, float] = Field(..., description="Breakdown of funding relevance indicators")
    relevant_opportunities_count: int = Field(default=0, description="Total active opportunities matched from Module 4")


class Member4FactorsSummary(BaseModel):
    """Summary of all 3 factors provided by Member 4 for Module 7 integration."""
    technology_id: str
    technology_maturity: TechnologyMaturityResponse
    market_potential: MarketPotentialResponse
    funding_relevance: FundingRelevanceResponse
    combined_member4_weighted_score: float = Field(
        ..., 
        description="Sum of Member 4 weighted score contributions (max 50% out of total 100%)"
    )
