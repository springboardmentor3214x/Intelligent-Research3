"""
Technologies Router – Module 6 Technology Intelligence API

All endpoints for technology intelligence data.
Authentication: read endpoints are public; write endpoints require auth.

Endpoints:
    GET  /api/technologies                          — list all technologies
    GET  /api/technologies/emerging                 — emerging technologies
    GET  /api/technologies/{tech_id}                — technology detail
    GET  /api/technologies/{tech_id}/history        — yearly metrics
    GET  /api/technologies/{tech_id}/maturity       — maturity analysis
    GET  /api/technologies/{tech_id}/adoption       — adoption analysis
    GET  /api/technologies/{tech_id}/opportunities  — opportunity signals
    GET  /api/technologies/{tech_id}/competitors    — competitive orgs
    GET  /api/technologies/{tech_id}/sources        — data source status
    GET  /api/opportunities                         — all opportunities
    POST /api/technologies/sync                     — trigger data sync (auth)
    POST /api/technologies/{tech_id}/recalculate    — recalculate scores (auth)
"""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.technology import (
    DataSourceLog, Technology, TechnologyCompetitor,
    TechnologyMaturity, TechnologyMetric, TechnologyOpportunity, TechnologyTrend,
)
from app.models.user import User
from app.schemas.technology import (
    AdoptionOut, CompetitorOut, DataSourceStatusOut,
    MaturityIndicators, MaturityOut, MaturityWeights,
    OpportunityOut, SyncRequest, SyncResponse,
    TechnologyListOut, TechnologyOut, YearlyMetric,
    ExplanationOut,
)
from app.services.adoption_service import analyse_adoption
from app.services.maturity_service import WEIGHTS
from app.services.technology_sync_service import sync_technology

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/technologies", tags=["technology-intelligence"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_tech_or_404(db: Session, tech_id: str) -> Technology:
    tech = db.query(Technology).filter(Technology.technology_id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail=f"Technology '{tech_id}' not found")
    return tech


def _build_tech_out(tech: Technology) -> dict:
    maturity = tech.maturity
    trend = tech.trend
    return {
        "id": tech.id,
        "technology_id": tech.technology_id,
        "name": tech.name,
        "domain": tech.domain,
        "description": tech.description,
        "keywords": tech.keywords,
        "related_technologies": tech.related_technologies,
        "is_demo": tech.is_demo,
        "created_at": tech.created_at,
        "updated_at": tech.updated_at,
        "stage": maturity.stage if maturity else None,
        "score": maturity.score if maturity else None,
        "adoption_level": maturity.adoption_level if maturity else None,
        "research_direction": trend.research_direction if trend else None,
        "patent_direction": trend.patent_direction if trend else None,
        "confidence": maturity.confidence if maturity else None,
    }


def _build_maturity_out(tech: Technology) -> MaturityOut:
    m = tech.maturity
    t = tech.trend
    if not m:
        raise HTTPException(status_code=404, detail="Maturity analysis not yet calculated")

    explanation = m.explanation or {}
    return MaturityOut(
        technology_id=tech.technology_id,
        stage=m.stage,
        score=m.score,
        indicators=MaturityIndicators(
            researchGrowth=m.research_growth_score,
            patentGrowth=m.patent_growth_score,
            researchActivity=m.research_activity_score,
            patentActivity=m.patent_activity_score,
            organizationParticipation=m.organization_score,
            applicationDiversity=m.diversity_score,
        ),
        weights=MaturityWeights(),
        adoption=AdoptionOut(
            level=m.adoption_level or "Insufficient Data",
            trend=m.adoption_trend or "Insufficient Data",
        ),
        confidence=m.confidence,
        explanation=ExplanationOut(
            summary=explanation.get("summary", ""),
            evidence=explanation.get("evidence", []),
            limitations=explanation.get("limitations", []),
        ),
        methodology_version=m.methodology_version,
        calculated_at=m.calculated_at,
    )


# ─── GET /api/technologies ────────────────────────────────────────────────────

@router.get("", response_model=TechnologyListOut)
def list_technologies(
    stage: str | None = Query(None, description="Filter by stage: Emerging/Developing/Mature/Declining"),
    domain: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """List all analysed technologies with summary maturity and trend info."""
    query = db.query(Technology)

    if domain:
        query = query.filter(Technology.domain.ilike(f"%{domain}%"))
    if search:
        query = query.filter(Technology.name.ilike(f"%{search}%"))

    # Stage filter requires join with maturity
    if stage:
        query = query.join(TechnologyMaturity, Technology.id == TechnologyMaturity.technology_id).filter(
            TechnologyMaturity.stage.ilike(stage)
        )

    total = query.count()
    techs = query.offset(offset).limit(limit).all()

    data_modes = set()
    results = []
    for tech in techs:
        out = _build_tech_out(tech)
        # Check if any metrics are demo
        if any(m.is_demo for m in tech.metrics):
            data_modes.add("demo")
        else:
            data_modes.add("live")
        results.append(TechnologyOut(**out))

    data_mode = "demo" if "demo" in data_modes else "live"

    return TechnologyListOut(technologies=results, total=total, data_mode=data_mode)


# ─── GET /api/technologies/emerging ──────────────────────────────────────────

@router.get("/emerging", response_model=TechnologyListOut)
def list_emerging_technologies(
    domain: str | None = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    """Technologies with Emerging stage classification."""
    query = (
        db.query(Technology)
        .join(TechnologyMaturity, Technology.id == TechnologyMaturity.technology_id)
        .filter(TechnologyMaturity.stage == "Emerging")
    )
    if domain:
        query = query.filter(Technology.domain.ilike(f"%{domain}%"))

    techs = query.limit(limit).all()
    results = [TechnologyOut(**_build_tech_out(t)) for t in techs]
    return TechnologyListOut(technologies=results, total=len(results), data_mode="demo")


# ─── Opportunities Router (/api/opportunities) ──────────────────────────────
opportunities_router = APIRouter(prefix="/opportunities", tags=["technology-opportunities"])


def _query_all_opportunities(db: Session, limit: int = 50, min_confidence: float | None = None):
    query = (
        db.query(TechnologyOpportunity, Technology)
        .join(Technology, TechnologyOpportunity.technology_id == Technology.id)
    )
    if min_confidence is not None:
        query = query.filter(TechnologyOpportunity.confidence >= min_confidence)
    opps = query.limit(limit).all()
    return [
        OpportunityOut(
            id=o.id,
            technology_id=tech.technology_id,
            technology_name=tech.name,
            opportunity_type=o.opportunity_type,
            title=o.title,
            description=o.description,
            signals=o.signals,
            confidence=o.confidence,
            created_at=o.created_at,
        )
        for o, tech in opps
    ]


@opportunities_router.get("", response_model=list[OpportunityOut])
def list_opportunities_global(
    min_confidence: float | None = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """All innovation opportunity signals across all technologies."""
    return _query_all_opportunities(db, limit=limit, min_confidence=min_confidence)


# ─── GET /api/technologies/all/opportunities & /api/technologies/opportunities
@router.get("/all/opportunities", response_model=list[OpportunityOut])
@router.get("/opportunities", response_model=list[OpportunityOut])
def list_all_opportunities(
    min_confidence: float | None = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """All innovation opportunity signals across all technologies."""
    return _query_all_opportunities(db, limit=limit, min_confidence=min_confidence)


# ─── GET /api/technologies/{tech_id} ─────────────────────────────────────────

@router.get("/{tech_id}", response_model=TechnologyOut)
def get_technology(tech_id: str, db: Session = Depends(get_db)):
    """Get detailed technology record."""
    tech = _get_tech_or_404(db, tech_id)
    return TechnologyOut(**_build_tech_out(tech))


# ─── GET /api/technologies/{tech_id}/history ─────────────────────────────────

@router.get("/{tech_id}/history", response_model=list[YearlyMetric])
def get_technology_history(tech_id: str, db: Session = Depends(get_db)):
    """Yearly research, patent, org, application, and adoption metrics."""
    tech = _get_tech_or_404(db, tech_id)
    metrics = sorted(
        db.query(TechnologyMetric).filter(TechnologyMetric.technology_id == tech.id).all(),
        key=lambda m: m.year,
    )
    return [YearlyMetric.model_validate(m) for m in metrics]


# ─── GET /api/technologies/{tech_id}/maturity ────────────────────────────────

@router.get("/{tech_id}/maturity", response_model=MaturityOut)
def get_technology_maturity(tech_id: str, db: Session = Depends(get_db)):
    """
    Full maturity analysis for a technology.
    Includes all six indicator scores, weights, adoption (separate),
    confidence, explanation, and methodology version.

    Used by Module 7 (Innovation Score) as the Technology Maturity factor.
    """
    tech = _get_tech_or_404(db, tech_id)
    return _build_maturity_out(tech)


# ─── GET /api/technologies/{tech_id}/adoption ────────────────────────────────

@router.get("/{tech_id}/adoption")
def get_technology_adoption(tech_id: str, db: Session = Depends(get_db)):
    """
    Adoption analysis — kept SEPARATE from the six maturity indicators.
    Returns adoption level, trend, and yearly values.
    """
    tech = _get_tech_or_404(db, tech_id)
    metrics = sorted(
        db.query(TechnologyMetric).filter(TechnologyMetric.technology_id == tech.id).all(),
        key=lambda m: m.year,
    )
    if not metrics:
        return {"level": "Insufficient Data", "trend": "Insufficient Data", "yearly_values": {}}

    years = [m.year for m in metrics]
    adoption_vals = [m.adoption_rate for m in metrics]
    result = analyse_adoption(adoption_vals, years)
    result["data_source"] = "demo" if any(m.is_demo for m in metrics) else "live"
    return result


# ─── GET /api/technologies/{tech_id}/opportunities ───────────────────────────

@router.get("/{tech_id}/opportunities", response_model=list[OpportunityOut])
def get_technology_opportunities(tech_id: str, db: Session = Depends(get_db)):
    """Innovation opportunity signals for a specific technology."""
    tech = _get_tech_or_404(db, tech_id)
    opps = db.query(TechnologyOpportunity).filter(
        TechnologyOpportunity.technology_id == tech.id
    ).all()
    return [
        OpportunityOut(
            id=o.id,
            technology_id=tech.technology_id,
            technology_name=tech.name,
            opportunity_type=o.opportunity_type,
            title=o.title,
            description=o.description,
            signals=o.signals,
            confidence=o.confidence,
            created_at=o.created_at,
        )
        for o in opps
    ]




# ─── GET /api/technologies/{tech_id}/competitors ─────────────────────────────

@router.get("/{tech_id}/competitors", response_model=list[CompetitorOut])
def get_technology_competitors(
    tech_id: str,
    limit: int = Query(15, le=50),
    db: Session = Depends(get_db),
):
    """Top organizations active in this technology."""
    tech = _get_tech_or_404(db, tech_id)
    competitors = (
        db.query(TechnologyCompetitor)
        .filter(TechnologyCompetitor.technology_id == tech.id)
        .order_by(TechnologyCompetitor.research_count.desc().nullslast())
        .limit(limit)
        .all()
    )
    return [CompetitorOut.model_validate(c) for c in competitors]


# ─── GET /api/technologies/{tech_id}/sources ─────────────────────────────────

@router.get("/{tech_id}/sources", response_model=list[DataSourceStatusOut])
def get_data_sources(tech_id: str, db: Session = Depends(get_db)):
    """Data source status and provenance for a technology."""
    _get_tech_or_404(db, tech_id)
    logs = (
        db.query(DataSourceLog)
        .filter(DataSourceLog.query == tech_id)
        .order_by(DataSourceLog.last_updated.desc())
        .limit(10)
        .all()
    )
    return [DataSourceStatusOut.model_validate(l) for l in logs]


# ─── POST /api/technologies/sync (auth required) ─────────────────────────────

@router.post("/sync", response_model=SyncResponse)
async def sync_technologies(
    payload: SyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger data ingestion from external APIs (OpenAlex, PatentsView).
    Requires authentication.
    """
    results = []
    source_logs = []

    for name in payload.technology_names:
        try:
            result = await sync_technology(
                db, name, use_demo_fallback=payload.use_demo_fallback
            )
            results.append(result)
        except Exception as e:
            logger.error("Sync failed for %s: %s", name, e)
            results.append({"technology_name": name, "status": "error", "error": str(e)})

    statuses = list({r.get("data_mode", "live") for r in results})
    main_status = "demo" if "demo" in statuses else "live"

    return SyncResponse(
        technologies_processed=len(results),
        sources_queried=["OpenAlex", "PatentsView"],
        status=main_status,
        message=f"Processed {len(results)} technologies",
        data_sources=[],
    )


# ─── POST /api/technologies/{tech_id}/recalculate (auth required) ────────────

@router.post("/{tech_id}/recalculate")
async def recalculate_technology(
    tech_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-run trend, maturity, and opportunity calculations from stored metrics."""
    tech = _get_tech_or_404(db, tech_id)
    try:
        result = await sync_technology(db, tech.name, use_demo_fallback=True)
        return {"status": "success", "technology_id": tech_id, "stage": result.get("stage")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
