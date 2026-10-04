from typing import Optional

from pydantic import BaseModel, Field


class InnovationScoreRequest(BaseModel):
    technology_id: str = Field(..., min_length=1)

    research_novelty: Optional[float] = Field(
        default=None, ge=0.0, le=100.0
    )
    patent_strength: Optional[float] = Field(
        default=None, ge=0.0, le=100.0
    )
    technology_maturity: Optional[float] = Field(
        default=None, ge=0.0, le=100.0
    )
    market_potential: Optional[float] = Field(
        default=None, ge=0.0, le=100.0
    )
    funding_relevance: Optional[float] = Field(
        default=None, ge=0.0, le=100.0
    )


class InnovationScoreResponse(BaseModel):
    technology_id: str

    research_novelty: Optional[float] = None
    patent_strength: Optional[float] = None
    technology_maturity: Optional[float] = None
    market_potential: Optional[float] = None
    funding_relevance: Optional[float] = None

    innovation_score: Optional[float] = None

    explanation: Optional[str] = None

    status: str
    methodology_version: str = "innovation_v1"
    missing_factors: Optional[list[str]] = None