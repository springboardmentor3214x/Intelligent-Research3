from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.innovation_score import InnovationScore
from app.schemas.module7_member5 import (
    InnovationScoreRequest,
    InnovationScoreResponse,
)
from app.services.module7_member5_service import calculate_innovation_score


router = APIRouter(
    prefix="/api/innovation",
    tags=["Module 7 - Member 5"],
)


@router.post(
    "/innovation-score",
    response_model=InnovationScoreResponse,
)
def calculate_score(
    payload: InnovationScoreRequest,
    db: Session = Depends(get_db),
):
    result = calculate_innovation_score(
        research_novelty=payload.research_novelty,
        patent_strength=payload.patent_strength,
        technology_maturity=payload.technology_maturity,
        market_potential=payload.market_potential,
        funding_relevance=payload.funding_relevance,
    )

    missing_factors = result.get("missing_factors", [])

    innovation_record = InnovationScore(
        technology_id=payload.technology_id,
        research_novelty=payload.research_novelty,
        patent_strength=payload.patent_strength,
        technology_maturity=payload.technology_maturity,
        market_potential=payload.market_potential,
        funding_relevance=payload.funding_relevance,
        innovation_score=result["innovation_score"],
        status=result["status"],
        missing_factors=", ".join(missing_factors)
        if missing_factors
        else None,
        explanation=result["explanation"],
    )

    db.add(innovation_record)
    db.commit()
    db.refresh(innovation_record)

    return InnovationScoreResponse(
        technology_id=payload.technology_id,
        research_novelty=payload.research_novelty,
        patent_strength=payload.patent_strength,
        technology_maturity=payload.technology_maturity,
        market_potential=payload.market_potential,
        funding_relevance=payload.funding_relevance,
        innovation_score=result["innovation_score"],
        explanation=result["explanation"],
        status=result["status"],
    )


@router.get(
    "/innovation-score/{technology_id}",
    response_model=InnovationScoreResponse,
)
def get_innovation_score(
    technology_id: str,
    db: Session = Depends(get_db),
):
    record = (
        db.query(InnovationScore)
        .filter(InnovationScore.technology_id == technology_id)
        .order_by(InnovationScore.id.desc())
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Innovation score not found for this technology.",
        )

    return InnovationScoreResponse(
        technology_id=record.technology_id,
        research_novelty=record.research_novelty,
        patent_strength=record.patent_strength,
        technology_maturity=record.technology_maturity,
        market_potential=record.market_potential,
        funding_relevance=record.funding_relevance,
        innovation_score=record.innovation_score,
        explanation=record.explanation,
        status=record.status,
    )