from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.routers.module7_member4 import get_member4_factors_summary

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
        methodology_version="innovation_v1",
        missing_factors=", ".join(missing_factors) if missing_factors else None,
        explanation=result["explanation"],
    )

    db.rollback()
    db.add(innovation_record)
    db.commit()

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
        methodology_version="innovation_v1",
        missing_factors=missing_factors,
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
        from fastapi import HTTPException

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
        methodology_version=record.methodology_version,
        missing_factors=record.missing_factors.split(", ") if record.missing_factors else [],
    )


@router.get(
    "/innovation-score/{technology_id}/breakdown",
)
def get_innovation_score_breakdown(
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
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Innovation score not found for this technology.",
        )

    return {
        "technology_id": record.technology_id,
        "factors": {
            "research_novelty": {
                "score": record.research_novelty,
                "weight": 30,
            },
            "patent_strength": {
                "score": record.patent_strength,
                "weight": 20,
            },
            "technology_maturity": {
                "score": record.technology_maturity,
                "weight": 15,
            },
            "market_potential": {
                "score": record.market_potential,
                "weight": 20,
            },
            "funding_relevance": {
                "score": record.funding_relevance,
                "weight": 15,
            },
        },
        "innovation_score": record.innovation_score,
        "status": record.status,
    }


@router.get(
    "/innovation-score/{technology_id}/explanation",
)
def get_innovation_score_explanation(
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
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Innovation score not found for this technology.",
        )

    return {
        "technology_id": record.technology_id,
        "innovation_score": record.innovation_score,
        "status": record.status,
        "explanation": record.explanation,
    }


@router.get(
    "/innovation-score/{technology_id}/calculate-from-modules",
    response_model=InnovationScoreResponse,
)
def calculate_score_from_modules(
    technology_id: str,
    db: Session = Depends(get_db),
):
    member4 = get_member4_factors_summary(
        technology_id=technology_id,
        db=db,
    )

    db.rollback()

    research_novelty = None
    patent_strength = None

    try:
        from app.models.technology import Technology
        from app.services.patent_strength_service import compute_patent_strength
        from app.services.novelty_service import compute_research_novelty

        tech = (
            db.query(Technology)
            .filter(
                (Technology.technology_id == technology_id)
                | (Technology.name.ilike(f"%{technology_id}%"))
            )
            .first()
        )

        if tech:
            mat = tech.maturity
            if mat:
                p_res = compute_patent_strength(
                    activity=float(mat.patent_activity_score or 50.0),
                    growth=float(mat.patent_growth_score or 50.0),
                    citations=round(float(mat.patent_activity_score or 50.0) * 0.85 + 10.0, 2),
                    family_breadth=float(mat.diversity_score or 50.0),
                    coverage=float(mat.diversity_score or 50.0),
                    competitor_activity=float(mat.organization_score or 50.0),
                )
                patent_strength = p_res.get("score")

            new_text = tech.description or tech.name
            existing_texts = [r for r in (tech.related_technologies or []) if isinstance(r, str)]
            if not existing_texts:
                existing_texts = [
                    "conventional computing algorithms",
                    "silicon microarchitecture standards",
                    "classic networking infrastructure",
                ]
            n_res = compute_research_novelty(
                new_text=new_text,
                existing_texts=existing_texts,
                research_gap_evidence=float(mat.research_growth_score if mat else 70.0),
                emerging_topic_evidence=float(mat.research_activity_score if mat else 75.0),
                new_direction_evidence=float(mat.diversity_score if mat else 65.0),
            )
            research_novelty = n_res.get("score")

    except Exception:
        pass



    result = calculate_innovation_score(
        research_novelty=research_novelty,
        patent_strength=patent_strength,
        technology_maturity=member4.technology_maturity.score,
        market_potential=member4.market_potential.score,
        funding_relevance=member4.funding_relevance.score,
    )

    missing_factors = result.get("missing_factors", [])

    innovation_record = InnovationScore(
        technology_id=technology_id,
        research_novelty=research_novelty,
        patent_strength=patent_strength,
        technology_maturity=member4.technology_maturity.score,
        market_potential=member4.market_potential.score,
        funding_relevance=member4.funding_relevance.score,
        innovation_score=result["innovation_score"],
        status=result["status"],
        methodology_version="innovation_v1",
        missing_factors=", ".join(missing_factors) if missing_factors else None,
        explanation=result["explanation"],
    )

    db.rollback()
    db.add(innovation_record)
    db.commit()
    db.refresh(innovation_record)

    return InnovationScoreResponse(
        technology_id=technology_id,
        research_novelty=research_novelty,
        patent_strength=patent_strength,
        technology_maturity=member4.technology_maturity.score,
        market_potential=member4.market_potential.score,
        funding_relevance=member4.funding_relevance.score,
        innovation_score=result["innovation_score"],
        explanation=result["explanation"],
        status=result["status"],
        methodology_version="innovation_v1",
        missing_factors=missing_factors,
    )
