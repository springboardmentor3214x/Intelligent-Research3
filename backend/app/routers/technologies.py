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
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user, get_current_user_optional
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
        "indicators": {
            "researchGrowth": maturity.research_growth_score,
            "patentGrowth": maturity.patent_growth_score,
            "researchActivity": maturity.research_activity_score,
            "patentActivity": maturity.patent_activity_score,
            "organizationParticipation": maturity.organization_score,
            "applicationDiversity": maturity.diversity_score,
        } if maturity else None,
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


# ─── Search & Ingestion Core Logic ──────────────────────────────────────────

async def _execute_technology_search(
    query_str: str | None,
    db: Session,
    stage: str | None = None,
    domain: str | None = None,
    limit: int = 50,
    offset: int = 0,
    auto_ingest: bool = True,
) -> TechnologyListOut:
    """
    Search technologies in database, triggering live OpenAlex + PatentsView
    ingestion if the technology does not exist or has insufficient data.
    """
    search_term = (query_str or "").strip()

    if not search_term:
        query = db.query(Technology)
        if domain and domain != "ALL":
            query = query.filter(Technology.domain.ilike(f"%{domain}%"))
        if stage and stage != "ALL":
            query = query.join(TechnologyMaturity, Technology.id == TechnologyMaturity.technology_id).filter(
                TechnologyMaturity.stage.ilike(stage)
            )
        total = query.count()
        techs = query.offset(offset).limit(limit).all()
        data_modes = {"demo" if any(m.is_demo for m in t.metrics) else "live" for t in techs} or {"live"}
        return TechnologyListOut(
            technologies=[TechnologyOut(**_build_tech_out(t)) for t in techs],
            total=total,
            data_mode="demo" if "demo" in data_modes else "live",
        )

    # 1. Search database
    base_query = db.query(Technology).filter(
        (Technology.name.ilike(f"%{search_term}%"))
        | (Technology.technology_id.ilike(f"%{search_term}%"))
        | (Technology.domain.ilike(f"%{search_term}%"))
    )
    if domain and domain != "ALL":
        base_query = base_query.filter(Technology.domain.ilike(f"%{domain}%"))
    if stage and stage != "ALL":
        base_query = base_query.join(TechnologyMaturity, Technology.id == TechnologyMaturity.technology_id).filter(
            TechnologyMaturity.stage.ilike(stage)
        )

    matched = base_query.all()

    # 2. Check if sufficient live data exists
    needs_ingestion = False
    if not matched:
        needs_ingestion = True
    else:
        # Check closest match (exact name or first match)
        exact_match = next((t for t in matched if t.name.lower() == search_term.lower()), matched[0])
        metric_count = (
            db.query(TechnologyMetric)
            .filter(TechnologyMetric.technology_id == exact_match.id, TechnologyMetric.is_demo == False)
            .count()
        )
        if metric_count == 0 or not exact_match.maturity:
            needs_ingestion = True

    # 3. Trigger live ingestion if insufficient
    if needs_ingestion and auto_ingest:
        logger.info("Live data insufficient for '%s' — querying OpenAlex & PatentsView", search_term)
        try:
            domain_arg = domain if (domain and domain != "ALL") else None
            await sync_technology(db, search_term, domain=domain_arg, use_demo_fallback=False)
        except Exception as e:
            logger.error("Live ingestion failed for '%s': %s", search_term, e)

    # 4. Final database query
    final_query = db.query(Technology).filter(
        (Technology.name.ilike(f"%{search_term}%"))
        | (Technology.technology_id.ilike(f"%{search_term}%"))
        | (Technology.domain.ilike(f"%{search_term}%"))
    )
    if domain and domain != "ALL":
        final_query = final_query.filter(Technology.domain.ilike(f"%{domain}%"))
    if stage and stage != "ALL":
        final_query = final_query.join(TechnologyMaturity, Technology.id == TechnologyMaturity.technology_id).filter(
            TechnologyMaturity.stage.ilike(stage)
        )

    total = final_query.count()
    techs = final_query.offset(offset).limit(limit).all()

    # Sort exact match first
    techs.sort(key=lambda t: 0 if t.name.lower() == search_term.lower() else 1)

    data_modes = set()
    results = []
    for tech in techs:
        out = _build_tech_out(tech)
        if any(m.is_demo for m in tech.metrics):
            data_modes.add("demo")
        else:
            data_modes.add("live")
        results.append(TechnologyOut(**out))

    data_mode = "demo" if "demo" in data_modes else "live"
    return TechnologyListOut(technologies=results, total=total, data_mode=data_mode)


# ─── GET /api/technologies ────────────────────────────────────────────────────

@router.get("", response_model=TechnologyListOut)
async def list_technologies(
    stage: str | None = Query(None, description="Filter by stage: Emerging/Developing/Mature/Declining"),
    domain: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """List or search all analysed technologies with summary maturity and trend info."""
    return await _execute_technology_search(
        search, db, stage=stage, domain=domain, limit=limit, offset=offset
    )


# ─── GET /api/technologies/search ─────────────────────────────────────────────

@router.get("/search", response_model=TechnologyListOut)
async def search_technologies(
    q: str = Query(..., min_length=1, description="Technology search query"),
    domain: str | None = Query(None),
    stage: str | None = Query(None),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    """Search for technologies with live OpenAlex & PatentsView auto-ingestion."""
    return await _execute_technology_search(
        q, db, stage=stage, domain=domain, limit=limit
    )


# ─── POST /api/technologies/search ────────────────────────────────────────────

@router.post("/search", response_model=TechnologyListOut)
async def search_technologies_post(
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    POST search endpoint for technology intelligence.
    Payload: {"q": "computer"} or {"query": "computer"} or {"name": "computer"}
    """
    query_str = (
        payload.get("q")
        or payload.get("query")
        or payload.get("search")
        or payload.get("name")
        or ""
    )
    domain = payload.get("domain")
    stage = payload.get("stage")
    limit = int(payload.get("limit", 50))
    return await _execute_technology_search(
        query_str, db, stage=stage, domain=domain, limit=limit
    )


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
    return TechnologyListOut(technologies=results, total=len(results), data_mode="live")


# ── POST /api/technologies/purge-demo (admin — removes any demo data) ─────────
@router.post("/purge-demo")
def purge_demo_technologies(db: Session = Depends(get_db)):
    """
    Remove all technologies marked as demo from the database.
    Call this once to clean up any previously seeded fake data.
    """
    from app.models.technology import (
        TechnologyMetric, TechnologyMaturity, TechnologyTrend,
        TechnologyOpportunity, TechnologyCompetitor, DataSourceLog,
    )

    # Find all demo technologies
    demo_techs = db.query(Technology).filter(Technology.is_demo == True).all()
    demo_ids = [t.id for t in demo_techs]

    if not demo_ids:
        # Also check for metrics marked as demo even if tech is not
        demo_metric_techs = (
            db.query(Technology)
            .join(TechnologyMetric, Technology.id == TechnologyMetric.technology_id)
            .filter(TechnologyMetric.is_demo == True)
            .distinct()
            .all()
        )
        demo_ids = list(set(demo_ids + [t.id for t in demo_metric_techs]))

    deleted = 0
    for tid in demo_ids:
        db.query(TechnologyOpportunity).filter(TechnologyOpportunity.technology_id == tid).delete()
        db.query(TechnologyCompetitor).filter(TechnologyCompetitor.technology_id == tid).delete()
        db.query(TechnologyMetric).filter(TechnologyMetric.technology_id == tid).delete()
        db.query(TechnologyMaturity).filter(TechnologyMaturity.technology_id == tid).delete()
        db.query(TechnologyTrend).filter(TechnologyTrend.technology_id == tid).delete()
        db.query(Technology).filter(Technology.id == tid).delete()
        deleted += 1

    # Also purge demo metrics from non-demo technologies
    db.query(TechnologyMetric).filter(TechnologyMetric.is_demo == True).delete()

    db.commit()
    return {
        "message": f"Purged {deleted} demo technologies and all demo metrics",
        "deleted_technologies": deleted,
    }


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
    tech = _get_tech_or_404(db, tech_id)
    logs = (
        db.query(DataSourceLog)
        .filter(or_(DataSourceLog.query == tech_id, DataSourceLog.query.ilike(f"%{tech.name}%")))
        .order_by(DataSourceLog.last_updated.desc())
        .limit(10)
        .all()
    )
    return [DataSourceStatusOut.model_validate(l) for l in logs]


# ─── POST /api/technologies/sync (flexible contract: names or id) ────────────

@router.post("/sync", response_model=SyncResponse)
async def sync_technologies(
    payload: SyncRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Trigger data ingestion from external APIs (OpenAlex, PatentsView).
    Accepts technology_names: list[str] or technology_id: str.
    """
    names = list(payload.technology_names) if payload.technology_names else []
    if payload.technology_id:
        tech = db.query(Technology).filter(Technology.technology_id == payload.technology_id).first()
        if tech and tech.name and tech.name not in names:
            names.append(tech.name)
        elif not names:
            clean_name = payload.technology_id.replace("TECH_", "").replace("_", " ").title()
            names.append(clean_name)

    if not names:
        names = ["computer"]

    results = []
    for name in names:
        try:
            result = await sync_technology(
                db, name, use_demo_fallback=payload.use_demo_fallback
            )
            results.append(result)
        except Exception as e:
            logger.error("Sync failed for %s: %s", name, e)
            results.append({"technology_name": name, "status": "error", "error": str(e), "data_mode": "error"})

    statuses = list({r.get("data_mode", "live") for r in results})
    main_status = "error" if all(r.get("status") == "error" for r in results) else ("partial" if "partial" in statuses else "live")

    # Populate primary technology details for response contract
    primary_tech_out = None
    research_metrics = []
    patent_metrics = []
    primary_maturity = None
    primary_stage = None

    if results and results[0].get("technology_id"):
        first_tech = db.query(Technology).filter(Technology.technology_id == results[0]["technology_id"]).first()
        if first_tech:
            primary_tech_out = TechnologyOut(**_build_tech_out(first_tech))
            primary_stage = first_tech.maturity.stage if first_tech.maturity else None
            try:
                primary_maturity = _build_maturity_out(first_tech)
            except Exception:
                primary_maturity = None
            for m in sorted(first_tech.metrics, key=lambda x: x.year):
                research_metrics.append({"year": m.year, "count": m.research_papers, "source": m.source})
                patent_metrics.append({"year": m.year, "count": m.patents, "source": results[0].get("patent_source") or "PatentsView"})

    recent_logs = (
        db.query(DataSourceLog)
        .order_by(DataSourceLog.last_updated.desc())
        .limit(10)
        .all()
    )
    data_sources_out = [DataSourceStatusOut.model_validate(l) for l in recent_logs]

    return SyncResponse(
        technologies_processed=len(results),
        sources_queried=["OpenAlex", "Google Gemini AI", "PatentsView"],
        status=main_status,
        message=f"Ingested real-time telemetry for {len(results)} technologies from OpenAlex & Google Gemini AI",
        technology=primary_tech_out,
        research_metrics=research_metrics,
        patent_metrics=patent_metrics,
        maturity=primary_maturity,
        stage=primary_stage,
        data_provenance=main_status,
        ingestion_status="success" if main_status in ("live", "partial") else "failed",
        data_sources=data_sources_out,
    )


# ─── POST /api/technologies/{tech_id}/recalculate ────────────────────────────

@router.post("/{tech_id}/recalculate")
async def recalculate_technology(
    tech_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Re-run full real-time sync: fetch fresh data from OpenAlex + PatentsView."""
    tech = _get_tech_or_404(db, tech_id)
    try:
        result = await sync_technology(db, tech.name, use_demo_fallback=False)
        return {
            "status": "success",
            "technology_id": tech_id,
            "stage": result.get("stage"),
            "data_mode": result.get("data_mode"),
            "research_papers_total": result.get("research_papers_total"),
            "organizations_found": result.get("organizations_found"),
            "patent_source": result.get("patent_source"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── POST /api/technologies/search-and-sync (public) ─────────────────────────

@router.post("/search-and-sync")
async def search_and_sync_technology(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Search for a technology by name and trigger real-time data ingestion.
    Returns immediately; data is available shortly after via GET /technologies.
    """
    technology_name = payload.get("name", "").strip()
    if not technology_name:
        raise HTTPException(status_code=400, detail="'name' is required")

    tech_id = __import__('app.services.technology_sync_service', fromlist=['make_technology_id']).make_technology_id(technology_name)

    # Check if already exists
    existing = db.query(Technology).filter(Technology.technology_id == tech_id).first()
    if existing:
        return {
            "message": f"Technology '{technology_name}' already exists — trigger /recalculate to refresh",
            "technology_id": tech_id,
            "exists": True,
        }

    # Run full real-time sync immediately
    try:
        result = await sync_technology(db, technology_name, use_demo_fallback=False)
        return {
            "message": f"Real-time data ingested for '{technology_name}'",
            "technology_id": tech_id,
            "exists": False,
            "stage": result.get("stage"),
            "data_mode": result.get("data_mode"),
            "research_papers_total": result.get("research_papers_total"),
            "organizations_found": result.get("organizations_found"),
            "patent_source": result.get("patent_source"),
        }
    except Exception as e:
        logger.error("search-and-sync failed for '%s': %s", technology_name, e)
        raise HTTPException(status_code=500, detail=str(e))
