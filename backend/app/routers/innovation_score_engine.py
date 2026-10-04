"""
backend/app/routers/innovation_score_engine.py
REST APIs for Module 7: Innovation Scoring Engine

Endpoints:
- GET  /api/innovation-score/{technology_id}             - Calculate/retrieve innovation score
- POST /api/innovation-score/calculate                  - Recalculate innovation score
- GET  /api/innovation-score/{technology_id}/breakdown   - Five factors breakdown
- GET  /api/innovation-score/{technology_id}/explanation - Natural language explanation
- GET  /api/innovation-score/{technology_id}/evidence    - Auditable source evidence
- GET  /api/innovation-score/{technology_id}/history     - Historical score calculations
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.innovation_scoring_service import (
    evaluate_technology_innovation,
    get_latest_innovation_score,
    get_innovation_score_history,
)

router = APIRouter(prefix="/innovation-score", tags=["Module 7 - Innovation Scoring Engine"])


class CalculateScoreRequest(BaseModel):
    technology_id: str = Field(..., min_length=1, description="Unique technology identifier or name")
    force_refresh: bool = Field(default=True, description="Whether to recalculate from fresh module data")


@router.get("/{technology_id}", summary="Get or calculate Innovation Score for a technology")
def get_innovation_score(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns the evidence-based Innovation Score (0-100) calculated from:
    Research Novelty (30%), Patent Strength (20%), Technology Maturity (15%),
    Market Potential (20%), and Funding Relevance (15%).
    """
    try:
        result = get_latest_innovation_score(db, technology_id)
        if not result:
            raise HTTPException(status_code=404, detail="Technology innovation score could not be calculated.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")


@router.post("/calculate", summary="Recalculate Innovation Score for a technology")
def recalculate_innovation_score(payload: CalculateScoreRequest, db: Session = Depends(get_db)):
    """
    Forces recalculation of the Innovation Score from active intelligence in Modules 3, 4, 5, and 6.
    """
    try:
        result = evaluate_technology_innovation(db, payload.technology_id, persist=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recalculation error: {str(e)}")


@router.get("/{technology_id}/breakdown", summary="Get detailed factor breakdown for a technology")
def get_factor_breakdown(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns the 5 official factor scores, weights, contributions, and indicators.
    """
    score = get_latest_innovation_score(db, technology_id)
    if not score:
        raise HTTPException(status_code=404, detail="Score not found for this technology.")
    return {
        "technology_id": score.get("technology_id"),
        "overall_score": score.get("overall_score"),
        "status": score.get("status"),
        "data_completeness": score.get("data_completeness"),
        "factors": score.get("factors"),
    }


@router.get("/{technology_id}/explanation", summary="Get plain-language explanation of the score")
def get_score_explanation(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns an auditable, deterministic explanation grounded in the actual calculated scores.
    """
    score = get_latest_innovation_score(db, technology_id)
    if not score:
        raise HTTPException(status_code=404, detail="Score not found for this technology.")
    return {
        "technology_id": score.get("technology_id"),
        "overall_score": score.get("overall_score"),
        "status": score.get("status"),
        "explanation": score.get("explanation"),
    }


@router.get("/{technology_id}/evidence", summary="Get source evidence across all modules")
def get_score_evidence(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns traceable evidence items mapped to Modules 3, 4, 5, and 6.
    """
    score = get_latest_innovation_score(db, technology_id)
    if not score:
        raise HTTPException(status_code=404, detail="Score not found for this technology.")
    return {
        "technology_id": score.get("technology_id"),
        "overall_score": score.get("overall_score"),
        "data_completeness": score.get("data_completeness"),
        "evidence": score.get("evidence"),
    }


@router.get("/{technology_id}/history", summary="Get historical score calculations")
def get_score_history(technology_id: str, db: Session = Depends(get_db)):
    """
    Returns historical score calculations to show score evolution over time.
    """
    history = get_innovation_score_history(db, technology_id)
    return {
        "technology_id": technology_id,
        "history": history,
        "count": len(history),
    }
