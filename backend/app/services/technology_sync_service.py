"""
Technology Sync Service – Module 6 Technology Intelligence

Orchestrates data ingestion from external APIs into the database.

Pipeline:
1. Fetch research data (OpenAlex)
2. Fetch patent data (PatentsView)
3. Fetch organization data (OpenAlex institutions)
4. Persist yearly metrics
5. Calculate trends
6. Normalize indicators
7. Calculate maturity
8. Detect opportunities
9. Update data source logs
"""
from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.technology import (
    DataSourceLog, Technology, TechnologyCompetitor, TechnologyMaturity,
    TechnologyMetric, TechnologyOpportunity, TechnologyTrend,
)
from app.services.adoption_service import analyse_adoption
from app.services.maturity_service import analyse_maturity
from app.services.normalization_service import (
    build_normalization_context, normalize_technology,
)
from app.services.opportunity_service import detect_opportunities
from app.services.patent_data_service import (
    estimate_patents_from_research, fetch_yearly_patent_counts,
)
from app.services.research_data_service import (
    fetch_top_organizations, fetch_yearly_research_counts,
)
from app.services.trend_service import calculate_trend

logger = logging.getLogger(__name__)

ANALYSIS_YEARS = list(range(2019, 2026))  # 2019–2025 (7 years)


def make_technology_id(name: str) -> str:
    """Generate a consistent technology ID from the name."""
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return f"TECH_{slug.upper()[:20]}"


async def sync_technology(
    db: Session,
    technology_name: str,
    domain: str | None = None,
    use_demo_fallback: bool = True,
) -> dict:
    """
    Full sync pipeline for a single technology.
    Returns a status dict.
    """
    tech_id = make_technology_id(technology_name)
    source_logs = []
    data_mode = "live"

    # ── 1. Ensure Technology record exists ───────────────────────────────────
    tech = db.query(Technology).filter(Technology.technology_id == tech_id).first()
    if not tech:
        tech = Technology(
            technology_id=tech_id,
            name=technology_name,
            domain=domain or _infer_domain(technology_name),
            is_demo=False,
        )
        db.add(tech)
        db.flush()

    # ── 2. Fetch Research Data ────────────────────────────────────────────────
    research_result = await fetch_yearly_research_counts(
        technology_name, start_year=min(ANALYSIS_YEARS), end_year=max(ANALYSIS_YEARS)
    )
    _log_source(db, "OpenAlex", research_result, tech_id)
    source_logs.append(research_result)

    if research_result["status"] == "error" and use_demo_fallback:
        logger.warning("OpenAlex unavailable for %s — using demo data", technology_name)
        research_yearly = _demo_research_counts(technology_name)
        data_mode = "demo"
    else:
        research_yearly = research_result.get("yearly_counts", {})
        if not research_yearly and use_demo_fallback:
            research_yearly = _demo_research_counts(technology_name)
            data_mode = "demo"

    # ── 3. Fetch Patent Data ──────────────────────────────────────────────────
    patent_result = await fetch_yearly_patent_counts(
        technology_name, start_year=min(ANALYSIS_YEARS), end_year=max(ANALYSIS_YEARS)
    )
    _log_source(db, "PatentsView", patent_result, tech_id)
    source_logs.append(patent_result)

    if patent_result["status"] == "error" or not patent_result.get("yearly_counts"):
        logger.info("PatentsView unavailable — estimating patents from research data")
        patent_yearly = estimate_patents_from_research(research_yearly)
        patent_source = "Estimated from research data"
        if data_mode != "demo":
            data_mode = "cached"
    else:
        patent_yearly = patent_result.get("yearly_counts", {})
        patent_source = "PatentsView"

    # ── 4. Fetch Organization Data ────────────────────────────────────────────
    org_result = await fetch_top_organizations(technology_name)
    _log_source(db, "OpenAlex-Orgs", org_result, tech_id)

    # ── 5. Persist Yearly Metrics ─────────────────────────────────────────────
    for year in ANALYSIS_YEARS:
        existing = db.query(TechnologyMetric).filter(
            TechnologyMetric.technology_id == tech.id,
            TechnologyMetric.year == year,
        ).first()

        r_count = research_yearly.get(year)
        p_count = patent_yearly.get(year)
        org_count = _estimate_org_count(org_result.get("organizations", []), year, ANALYSIS_YEARS)
        app_count = _estimate_app_count(r_count)
        adoption = _estimate_adoption(r_count, p_count, year)

        if existing:
            existing.research_papers = r_count
            existing.patents = p_count
            existing.organizations = org_count
            existing.applications = app_count
            existing.adoption_rate = adoption
            existing.source = "OpenAlex"
            existing.is_demo = data_mode == "demo"
            existing.last_updated = datetime.utcnow()
        else:
            db.add(TechnologyMetric(
                technology_id=tech.id,
                year=year,
                research_papers=r_count,
                patents=p_count,
                organizations=org_count,
                applications=app_count,
                adoption_rate=adoption,
                source="OpenAlex",
                is_demo=data_mode == "demo",
            ))

    db.flush()

    # ── 6. Load metrics for analysis ─────────────────────────────────────────
    metrics = sorted(
        db.query(TechnologyMetric).filter(TechnologyMetric.technology_id == tech.id).all(),
        key=lambda m: m.year
    )
    years = [m.year for m in metrics]
    research_vals = [m.research_papers for m in metrics]
    patent_vals = [m.patents for m in metrics]
    org_vals = [m.organizations for m in metrics]
    app_vals = [m.applications for m in metrics]
    adoption_vals = [m.adoption_rate for m in metrics]

    # ── 7. Calculate Trend ────────────────────────────────────────────────────
    trend_data = calculate_trend(research_vals, patent_vals, org_vals, app_vals, years)

    existing_trend = db.query(TechnologyTrend).filter(
        TechnologyTrend.technology_id == tech.id
    ).first()
    if existing_trend:
        for k, v in trend_data.items():
            setattr(existing_trend, k, v)
        existing_trend.calculated_at = datetime.utcnow()
    else:
        db.add(TechnologyTrend(technology_id=tech.id, **trend_data))
    db.flush()

    # ── 8. Normalize + Maturity ───────────────────────────────────────────────
    # Build a single-technology normalization context
    # (In production with multiple technologies, build context across all)
    total_research = sum(v for v in research_vals if v) or 0
    total_patents = sum(v for v in patent_vals if v) or 0
    total_orgs = max(v for v in org_vals if v) if any(org_vals) else 0
    total_apps = max(v for v in app_vals if v) if any(app_vals) else 0

    # Simple single-tech context: use absolute values normalized against themselves
    # (cross-technology normalization is done by the listing endpoint)
    ctx = build_normalization_context([{
        "total_research": total_research,
        "total_patents": total_patents,
        "total_orgs": total_orgs,
        "total_apps": total_apps,
        "avg_research_growth": trend_data.get("research_growth") or 0,
        "avg_patent_growth": trend_data.get("patent_growth") or 0,
    }])

    normalized = normalize_technology({
        "total_research": total_research,
        "total_patents": total_patents,
        "total_orgs": total_orgs,
        "total_apps": total_apps,
        "avg_research_growth": trend_data.get("research_growth") or 0,
        "avg_patent_growth": trend_data.get("patent_growth") or 0,
    }, ctx)

    # Adoption (separate)
    adoption_analysis = analyse_adoption(adoption_vals, years)

    maturity_data = analyse_maturity(
        technology_id=tech_id,
        indicators=normalized,
        trend=trend_data,
        adoption={"level": adoption_analysis["level"], "trend": adoption_analysis["trend"]},
        data_coverage={
            "yearsAvailable": len(years),
            "researchYears": sum(1 for v in research_vals if v),
            "patentYears": sum(1 for v in patent_vals if v),
            "organizationYears": sum(1 for v in org_vals if v),
            "applicationYears": sum(1 for v in app_vals if v),
            "adoptionYears": adoption_analysis["years_available"],
        },
    )

    existing_maturity = db.query(TechnologyMaturity).filter(
        TechnologyMaturity.technology_id == tech.id
    ).first()
    if existing_maturity:
        existing_maturity.stage = maturity_data["stage"]
        existing_maturity.score = maturity_data["score"]
        existing_maturity.research_growth_score = normalized.get("research_growth_score")
        existing_maturity.patent_growth_score = normalized.get("patent_growth_score")
        existing_maturity.research_activity_score = normalized.get("research_activity_score")
        existing_maturity.patent_activity_score = normalized.get("patent_activity_score")
        existing_maturity.organization_score = normalized.get("organization_score")
        existing_maturity.diversity_score = normalized.get("diversity_score")
        existing_maturity.adoption_level = adoption_analysis["level"]
        existing_maturity.adoption_trend = adoption_analysis["trend"]
        existing_maturity.confidence = trend_data.get("confidence")
        existing_maturity.explanation = maturity_data["explanation"]
        existing_maturity.calculated_at = datetime.utcnow()
    else:
        db.add(TechnologyMaturity(
            technology_id=tech.id,
            stage=maturity_data["stage"],
            score=maturity_data["score"],
            research_growth_score=normalized.get("research_growth_score"),
            patent_growth_score=normalized.get("patent_growth_score"),
            research_activity_score=normalized.get("research_activity_score"),
            patent_activity_score=normalized.get("patent_activity_score"),
            organization_score=normalized.get("organization_score"),
            diversity_score=normalized.get("diversity_score"),
            adoption_level=adoption_analysis["level"],
            adoption_trend=adoption_analysis["trend"],
            confidence=trend_data.get("confidence"),
            explanation=maturity_data["explanation"],
        ))

    # ── 9. Opportunities ──────────────────────────────────────────────────────
    # Remove old opportunities then add fresh ones
    db.query(TechnologyOpportunity).filter(
        TechnologyOpportunity.technology_id == tech.id
    ).delete()

    opps = detect_opportunities(
        technology_id=tech_id,
        technology_name=technology_name,
        trend=trend_data,
        adoption={"level": adoption_analysis["level"], "trend": adoption_analysis["trend"]},
        indicators=normalized,
    )
    for opp in opps:
        db.add(TechnologyOpportunity(
            technology_id=tech.id,
            opportunity_type=opp["opportunity_type"],
            title=opp["title"],
            description=opp["description"],
            signals=opp["signals"],
            confidence=opp["confidence"],
        ))

    # ── 10. Competitors / Organizations ──────────────────────────────────────
    db.query(TechnologyCompetitor).filter(
        TechnologyCompetitor.technology_id == tech.id
    ).delete()

    for org in org_result.get("organizations", [])[:15]:
        db.add(TechnologyCompetitor(
            technology_id=tech.id,
            organization_name=org["name"],
            research_count=org["count"],
            research_trend="Increasing" if trend_data.get("research_direction") == "Increasing" else "Stable",
            source="OpenAlex",
            year=max(ANALYSIS_YEARS),
        ))

    db.commit()
    db.refresh(tech)

    return {
        "technology_id": tech_id,
        "technology_name": technology_name,
        "data_mode": data_mode,
        "stage": maturity_data["stage"],
        "score": maturity_data["score"],
        "years_analysed": len(years),
        "sources": source_logs,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _infer_domain(name: str) -> str:
    name_lower = name.lower()
    if any(k in name_lower for k in ["quantum", "physics"]):
        return "Quantum Technology"
    if any(k in name_lower for k in ["language model", "llm", "nlp", "gpt"]):
        return "Artificial Intelligence"
    if any(k in name_lower for k in ["deep learning", "machine learning", "neural", "ai"]):
        return "Artificial Intelligence"
    if any(k in name_lower for k in ["blockchain", "crypto"]):
        return "Distributed Systems"
    if any(k in name_lower for k in ["crispr", "genomics", "biotech"]):
        return "Biotechnology"
    if any(k in name_lower for k in ["solar", "battery", "energy"]):
        return "Clean Energy"
    return "General Technology"


def _estimate_org_count(orgs: list, year: int, years: list) -> int | None:
    """Estimate org count for a year using total org count + year scaling."""
    if not orgs:
        return None
    total = len(orgs)
    idx = years.index(year) if year in years else len(years) - 1
    # Scale so older years have fewer orgs (simple linear ramp)
    factor = (idx + 1) / len(years)
    return max(1, int(total * factor))


def _estimate_app_count(research_count: int | None) -> int | None:
    """Estimate application count as fraction of research activity."""
    if research_count is None:
        return None
    # Roughly 1 application area per 30 research papers
    return max(1, research_count // 30)


def _estimate_adoption(research: int | None, patents: int | None, year: int) -> float | None:
    """
    Rough adoption estimate: composite of research + patent with time lag.
    Low numbers = low adoption. Used only when no dedicated adoption source available.
    """
    if research is None:
        return None
    r = research or 0
    p = patents or 0
    # Simple heuristic: adoption lags research by ~2 years
    base = (r * 0.01 + p * 0.05)
    return round(min(base, 100.0), 2)


def _log_source(db: Session, source_name: str, result: dict, tech_id: str) -> None:
    """Persist a data source log entry."""
    db.add(DataSourceLog(
        source_name=source_name,
        endpoint=result.get("query"),
        query=result.get("query"),
        status=result.get("status", "unknown"),
        records_fetched=len(result.get("yearly_counts") or result.get("organizations") or []),
        error=result.get("error"),
        methodology_version="maturity_v1",
    ))


# ── Demo data (clearly labeled) ───────────────────────────────────────────────

DEMO_DATA: dict[str, dict[int, int]] = {
    "default": {2019: 100, 2020: 150, 2021: 200, 2022: 280, 2023: 400, 2024: 600, 2025: 900},
    "quantum": {2019: 100, 2020: 140, 2021: 180, 2022: 350, 2023: 700, 2024: 1200, 2025: 1800},
    "llm": {2019: 50, 2020: 120, 2021: 300, 2022: 800, 2023: 2500, 2024: 5000, 2025: 8000},
    "edge ai": {2019: 80, 2020: 130, 2021: 220, 2022: 390, 2023: 650, 2024: 980, 2025: 1500},
}


def _demo_research_counts(name: str) -> dict[int, int]:
    """Return clearly-labeled demo research counts when API is unavailable."""
    name_lower = name.lower()
    for key in DEMO_DATA:
        if key in name_lower:
            return DEMO_DATA[key]
    return DEMO_DATA["default"]
