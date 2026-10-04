"""
backend/app/routers/commercialization_engine.py
REST APIs for Module 8: Commercialization Recommendation Engine

Endpoints:
- GET  /api/commercialization/{technology_id}                      - Complete commercialization analysis
- POST /api/commercialization/analyze                             - Recalculate commercialization analysis
- GET  /api/commercialization/{technology_id}/productization      - Productization pathway details
- GET  /api/commercialization/{technology_id}/licensing           - Licensing pathway details
- GET  /api/commercialization/{technology_id}/startup             - Startup pathway details
- GET  /api/commercialization/{technology_id}/industry-partnership- Partnership pathway details
- GET  /api/commercialization/{technology_id}/roadmap             - Illustrative commercialization roadmap
- GET  /api/commercialization/{technology_id}/risks               - Commercialization risk matrix
- GET  /api/commercialization/{technology_id}/gaps                - Commercialization gap analysis
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.commercialization_service import (
    generate_commercialization_analysis,
    get_latest_commercialization_analysis,
)

router = APIRouter(prefix="/commercialization", tags=["Module 8 - Commercialization Recommendation Engine"])


class CommercializationAnalyzeRequest(BaseModel):
    technology_id: str = Field(..., min_length=1, description="Unique technology identifier or name")
    force_refresh: bool = Field(default=True, description="Whether to recalculate fresh commercialization analysis")


@router.get("/{technology_id}", summary="Get complete commercialization analysis for a technology")
def get_commercialization_analysis(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns evidence-based commercialization pathways (Productization, Licensing, Startup, Partnership),
    readiness score, gap analysis, risk analysis, and illustrative roadmap.
    """
    try:
        result = get_latest_commercialization_analysis(db, technology_id)
        if not result:
            raise HTTPException(status_code=404, detail="Commercialization intelligence not available.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Commercialization analysis error: {str(e)}")


@router.post("/analyze", summary="Generate or recalculate commercialization analysis")
def analyze_commercialization(payload: CommercializationAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Triggers re-analysis of commercialization pathways consuming active Module 7 and previous modules data.
    """
    try:
        result = generate_commercialization_analysis(db, payload.technology_id, persist=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis calculation error: {str(e)}")


@router.get("/{technology_id}/productization", summary="Get productization pathway details")
def get_productization_details(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns productization potential score, concept ideas, requirements, and risks.
    """
    analysis = get_latest_commercialization_analysis(db, technology_id)
    return {
        "technologyId": technology_id,
        "productization": analysis.get("pathways", {}).get("productization"),
    }


@router.get("/{technology_id}/licensing", summary="Get licensing pathway details")
def get_licensing_details(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns licensing opportunity score, potential licensees, rationale, and IP considerations.
    """
    analysis = get_latest_commercialization_analysis(db, technology_id)
    return {
        "technologyId": technology_id,
        "licensing": analysis.get("pathways", {}).get("licensing"),
    }


@router.get("/{technology_id}/startup", summary="Get startup creation pathway details")
def get_startup_details(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns startup creation score, problem statement, value proposition, and funding opportunities.
    """
    analysis = get_latest_commercialization_analysis(db, technology_id)
    return {
        "technologyId": technology_id,
        "startup": analysis.get("pathways", {}).get("startup"),
    }


@router.get("/{technology_id}/industry-partnership", summary="Get industry partnership pathway details")
def get_partnership_details(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns partnership opportunity score, potential partner organizations, and collaboration types.
    """
    analysis = get_latest_commercialization_analysis(db, technology_id)
    return {
        "technologyId": technology_id,
        "industryPartnership": analysis.get("pathways", {}).get("industryPartnership"),
    }


@router.get("/{technology_id}/roadmap", summary="Get commercialization roadmap")
def get_roadmap_details(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns a phased illustrative roadmap (Phases 1 to 4) with milestones and durations.
    """
    analysis = get_latest_commercialization_analysis(db, technology_id)
    return {
        "technologyId": technology_id,
        "roadmap": analysis.get("roadmap", []),
    }


@router.get("/{technology_id}/risks", summary="Get commercialization risk analysis")
def get_risks_details(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns structured risk matrix across Technology, Market, IP, Funding, Adoption, and Competition.
    """
    analysis = get_latest_commercialization_analysis(db, technology_id)
    return {
        "technologyId": technology_id,
        "risks": analysis.get("risks", []),
    }


@router.get("/{technology_id}/gaps", summary="Get commercialization gap analysis")
def get_gaps_details(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns commercialization gaps derived from weak or missing indicators with suggested mitigations.
    """
    analysis = get_latest_commercialization_analysis(db, technology_id)
    return {
        "technologyId": technology_id,
        "commercializationGaps": analysis.get("commercializationGaps", []),
    }
