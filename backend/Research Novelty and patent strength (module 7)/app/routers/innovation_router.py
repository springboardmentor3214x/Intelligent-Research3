"""
app/routers/innovation_router.py
------------------------------------
Exposes the two Member 3 endpoints:
    POST /api/innovation/research-novelty
    POST /api/innovation/patent-strength

In FastAPI, "routers" are the equivalent of Express route files - they
group related endpoints and get "included" into the main app.
"""

from fastapi import APIRouter
from app.schemas.innovation_schemas import ResearchNoveltyRequest, PatentStrengthRequest
from app.services.novelty_service import compute_research_novelty
from app.services.patent_strength_service import compute_patent_strength

router = APIRouter(prefix="/api/innovation", tags=["innovation-factors"])


@router.post("/research-novelty")
def research_novelty(payload: ResearchNoveltyRequest):
    result = compute_research_novelty(
        new_text=payload.new_text,
        existing_texts=payload.existing_texts,
        research_gap_evidence=payload.research_gap_evidence,
        emerging_topic_evidence=payload.emerging_topic_evidence,
        new_direction_evidence=payload.new_direction_evidence,
    )
    return {
        "technology_id": payload.technology_id,
        "factor": "research_novelty",
        **result,
    }


@router.post("/patent-strength")
def patent_strength(payload: PatentStrengthRequest):
    result = compute_patent_strength(
        activity=payload.activity,
        growth=payload.growth,
        citations=payload.citations,
        family_breadth=payload.family_breadth,
        coverage=payload.coverage,
        competitor_activity=payload.competitor_activity,
    )
    return {
        "technology_id": payload.technology_id,
        "factor": "patent_strength",
        **result,
    }
