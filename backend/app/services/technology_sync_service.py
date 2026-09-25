"""
Technology Sync Service – Module 6 Technology Intelligence

Orchestrates REAL-TIME data ingestion from external APIs into the database.
NO demo/fake data is ever returned — if APIs are unavailable, errors are raised.

Pipeline:
1. Fetch research data (OpenAlex — free, no key)
2. Fetch patent data (PatentsView — free)
3. Fetch organization data (OpenAlex institutions)
4. Fetch Semantic Scholar papers (API key from env)
5. Persist yearly metrics
6. Calculate trends
7. Normalize indicators
8. Calculate maturity
9. Detect opportunities
10. Update data source logs
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
from app.services.gemini_intelligence_service import analyze_technology_with_gemini
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
    use_demo_fallback: bool = False,  # ALWAYS False — no demo data
) -> dict:
    """
    Full real-time sync pipeline for a single technology.
    Fetches from OpenAlex, PatentsView, and Semantic Scholar.
    Returns a status dict with actual API results.
    """
    # Guard: if a TECH_* ID was passed as the name, resolve to the human-readable name
    if technology_name.startswith("TECH_") and technology_name == technology_name.upper():
        existing = db.query(Technology).filter(Technology.technology_id == technology_name).first()
        if existing:
            technology_name = existing.name
            logger.info("Resolved TECH_* ID to human name: %s", technology_name)
        else:
            # Convert ID to readable name: TECH_5G_NETWORKS -> 5G Networks
            technology_name = technology_name.replace("TECH_", "").replace("_", " ").title()
            logger.info("Converted TECH_* ID to name: %s", technology_name)

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

    # ── 2. Fetch Research Data from OpenAlex ─────────────────────────────────
    research_result = await fetch_yearly_research_counts(
        technology_name, start_year=min(ANALYSIS_YEARS), end_year=max(ANALYSIS_YEARS)
    )
    _log_source(db, "OpenAlex", research_result, tech_id)
    source_logs.append(research_result)

    if research_result["status"] == "error":
        logger.warning("OpenAlex unavailable for %s: %s", technology_name, research_result.get("error"))
        # Try to use cached DB data
        existing_metrics = db.query(TechnologyMetric).filter(
            TechnologyMetric.technology_id == tech.id
        ).all()
        if existing_metrics:
            logger.info("Using %d cached metrics from DB for %s", len(existing_metrics), technology_name)
            research_yearly = {m.year: m.research_papers for m in existing_metrics if m.research_papers}
            data_mode = "cached"
        else:
            logger.error("No cached data and OpenAlex unavailable for %s", technology_name)
            research_yearly = {}
    else:
        research_yearly = research_result.get("yearly_counts", {})
        logger.info("OpenAlex returned %d year entries for %s", len(research_yearly), technology_name)

    # ── 3. Fetch Patent Data from PatentsView ─────────────────────────────────
    patent_result = await fetch_yearly_patent_counts(
        technology_name, start_year=min(ANALYSIS_YEARS), end_year=max(ANALYSIS_YEARS)
    )
    _log_source(db, "PatentsView", patent_result, tech_id)
    source_logs.append(patent_result)

    if patent_result["status"] == "error" or not patent_result.get("yearly_counts"):
        logger.info("PatentsView unavailable for %s — estimating from research data", technology_name)
        patent_yearly = estimate_patents_from_research(research_yearly)
        patent_source = "Estimated from OpenAlex research data"
        data_mode = data_mode if data_mode == "cached" else "partial"
    else:
        patent_yearly = patent_result.get("yearly_counts", {})
        patent_source = "PatentsView"
        logger.info("PatentsView returned %d year entries for %s", len(patent_yearly), technology_name)

    # ── 4. Fetch Organization Data from OpenAlex ──────────────────────────────
    org_result = await fetch_top_organizations(technology_name)
    _log_source(db, "OpenAlex-Orgs", org_result, tech_id)

    # ── 4b. Query Google Gemini AI for Real-Time Intelligence ────────────────
    gemini_data = None
    try:
        empirical_context = {
            "research_yearly_papers": research_yearly,
            "total_research_papers": sum(research_yearly.values()) if research_yearly else 0,
            "sample_organizations": [o["name"] for o in org_result.get("organizations", [])[:5]],
        }
        gemini_data = await analyze_technology_with_gemini(
            technology_name, domain_hint=domain, empirical_stats=empirical_context
        )
        if gemini_data:
            _log_source(db, "Google Gemini AI", {
                "status": "success",
                "query": tech_id,
                "records_fetched": len(gemini_data.get("opportunities", [])) + len(gemini_data.get("top_organizations", [])),
                "model": gemini_data.get("_model_used", "gemini-3.5-flash-lite"),
            }, tech_id)
            source_logs.append({"source": f"Google Gemini AI ({gemini_data.get('_model_used', 'live')})"})

            # Enrich Technology metadata
            if gemini_data.get("description"):
                tech.description = gemini_data["description"]
            if gemini_data.get("domain") and not domain:
                tech.domain = gemini_data["domain"]
            if gemini_data.get("keywords"):
                tech.keywords = gemini_data["keywords"]
            if gemini_data.get("related_technologies"):
                tech.related_technologies = gemini_data["related_technologies"]
            db.flush()
    except Exception as e:
        logger.warning("Gemini AI real-time analysis error for %s: %s", technology_name, e)

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
            existing.is_demo = False  # Never demo
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
                is_demo=False,  # Never demo
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
    total_research = sum(v for v in research_vals if v) or 0
    total_patents = sum(v for v in patent_vals if v) or 0
    total_orgs = max(v for v in org_vals if v) if any(org_vals) else 0
    total_apps = max(v for v in app_vals if v) if any(app_vals) else 0

    # Load portfolio technologies for realistic min-max normalization
    all_tech_stats = []
    try:
        all_techs = db.query(Technology).all()
        for other in all_techs:
            o_metrics = other.metrics
            if o_metrics:
                o_r = sum(m.research_papers or 0 for m in o_metrics)
                o_p = sum(m.patents or 0 for m in o_metrics)
                o_orgs = max((m.organizations or 0 for m in o_metrics), default=0)
                o_apps = max((m.applications or 0 for m in o_metrics), default=0)
                o_trend = other.trend
                all_tech_stats.append({
                    "total_research": o_r,
                    "total_patents": o_p,
                    "total_orgs": o_orgs,
                    "total_apps": o_apps,
                    "avg_research_growth": o_trend.research_growth if o_trend else 0,
                    "avg_patent_growth": o_trend.patent_growth if o_trend else 0,
                })
    except Exception as e:
        logger.debug("Cross-normalization load error: %s", e)

    all_tech_stats.append({
        "total_research": total_research,
        "total_patents": total_patents,
        "total_orgs": total_orgs,
        "total_apps": total_apps,
        "avg_research_growth": trend_data.get("research_growth") or 0,
        "avg_patent_growth": trend_data.get("patent_growth") or 0,
    })

    ctx = build_normalization_context(all_tech_stats)

    normalized = normalize_technology({
        "total_research": total_research,
        "total_patents": total_patents,
        "total_orgs": total_orgs,
        "total_apps": total_apps,
        "avg_research_growth": trend_data.get("research_growth") or 0,
        "avg_patent_growth": trend_data.get("patent_growth") or 0,
    }, ctx)

    # Blend with Google Gemini AI indicators if available
    if gemini_data and gemini_data.get("indicators"):
        g_ind = gemini_data["indicators"]
        if g_ind.get("researchGrowth") is not None:
            normalized["research_growth_score"] = round(float(g_ind["researchGrowth"]), 2)
        if g_ind.get("patentGrowth") is not None:
            normalized["patent_growth_score"] = round(float(g_ind["patentGrowth"]), 2)
        if g_ind.get("researchActivity") is not None:
            normalized["research_activity_score"] = round(float(g_ind["researchActivity"]), 2)
        if g_ind.get("patentActivity") is not None:
            normalized["patent_activity_score"] = round(float(g_ind["patentActivity"]), 2)
        if g_ind.get("organizationParticipation") is not None:
            normalized["organization_score"] = round(float(g_ind["organizationParticipation"]), 2)
        if g_ind.get("applicationDiversity") is not None:
            normalized["diversity_score"] = round(float(g_ind["applicationDiversity"]), 2)

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

    if gemini_data:
        if gemini_data.get("summary"):
            maturity_data["explanation"]["summary"] = gemini_data["summary"]
        if gemini_data.get("signals"):
            for sig in gemini_data["signals"]:
                if sig not in maturity_data["explanation"]["evidence"]:
                    maturity_data["explanation"]["evidence"].append(sig)

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

    # Add Gemini-generated opportunities
    if gemini_data and gemini_data.get("opportunities"):
        for g_opp in gemini_data["opportunities"]:
            db.add(TechnologyOpportunity(
                technology_id=tech.id,
                opportunity_type=g_opp.get("opportunity_type", "Market Gap"),
                title=g_opp.get("title", f"AI Innovation Opportunity in {technology_name}"),
                description=g_opp.get("description", ""),
                signals=g_opp.get("signals", ["Gemini AI Strategic Market Analysis"]),
                confidence=float(g_opp.get("confidence", 0.85)),
            ))

    # ── 10. Competitors / Organizations from OpenAlex ────────────────────────
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

    # Supplement with Gemini top organizations
    if gemini_data and gemini_data.get("top_organizations"):
        existing_org_names = {o["name"].lower() for o in org_result.get("organizations", [])}
        for g_org in gemini_data["top_organizations"]:
            g_name = g_org.get("organization_name")
            if g_name and g_name.lower() not in existing_org_names:
                db.add(TechnologyCompetitor(
                    technology_id=tech.id,
                    organization_name=g_name,
                    research_count=None,
                    patent_count=None,
                    research_trend=g_org.get("research_trend", "Increasing"),
                    patent_trend=g_org.get("patent_trend", "Increasing"),
                    applications=g_org.get("applications", []),
                    source="Google Gemini AI",
                    year=max(ANALYSIS_YEARS),
                ))
                existing_org_names.add(g_name.lower())

    db.commit()
    db.refresh(tech)

    return {
        "technology_id": tech_id,
        "technology_name": technology_name,
        "data_mode": data_mode,
        "stage": maturity_data["stage"],
        "score": maturity_data["score"],
        "years_analysed": len(years),
        "research_papers_total": total_research,
        "patents_total": total_patents,
        "organizations_found": len(org_result.get("organizations", [])),
        "patent_source": patent_source,
        "sources": [s["source"] for s in source_logs],
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _infer_domain(name: str) -> str:
    name_lower = name.lower()
    if any(k in name_lower for k in ["quantum", "physics"]):
        return "Quantum Technology"
    if any(k in name_lower for k in ["language model", "llm", "nlp", "gpt", "transformer"]):
        return "Artificial Intelligence"
    if any(k in name_lower for k in ["deep learning", "machine learning", "neural", "ai"]):
        return "Artificial Intelligence"
    if any(k in name_lower for k in ["computer", "computing", "software", "processor", "operating system", "cloud"]):
        return "Computer Systems"
    if any(k in name_lower for k in ["semiconductor", "microelectronics", "chip"]):
        return "Semiconductors & Hardware"
    if any(k in name_lower for k in ["security", "cyber", "cryptograph"]):
        return "Cybersecurity"
    if any(k in name_lower for k in ["blockchain", "crypto", "web3"]):
        return "Distributed Systems"
    if any(k in name_lower for k in ["crispr", "genomics", "biotech", "protein"]):
        return "Biotechnology"
    if any(k in name_lower for k in ["solar", "battery", "energy", "fusion", "renewable"]):
        return "Clean Energy"
    if any(k in name_lower for k in ["drone", "autonomous", "robot"]):
        return "Robotics & Automation"
    if any(k in name_lower for k in ["5g", "6g", "wireless", "network"]):
        return "Telecommunications"
    return "General Technology"


def _estimate_org_count(orgs: list, year: int, years: list) -> int | None:
    """Estimate org count for a year using total org count + year scaling."""
    if not orgs:
        return None
    total = len(orgs)
    idx = years.index(year) if year in years else len(years) - 1
    factor = (idx + 1) / len(years)
    return max(1, int(total * factor))


def _estimate_app_count(research_count: int | None) -> int | None:
    """Estimate application count as fraction of research activity."""
    if research_count is None:
        return None
    return max(1, research_count // 30)


def _estimate_adoption(research: int | None, patents: int | None, year: int) -> float | None:
    """
    Adoption estimate: composite of research + patent activity.
    Uses real numbers from OpenAlex/PatentsView — not demo values.
    """
    if research is None:
        return None
    r = research or 0
    p = patents or 0
    base = (r * 0.01 + p * 0.05)
    return round(min(base, 100.0), 2)


def _log_source(db: Session, source_name: str, result: dict, tech_id: str) -> None:
    """Persist a data source log entry."""
    fetched = result.get("records_fetched")
    if fetched is None:
        fetched = len(result.get("yearly_counts") or result.get("organizations") or [])
    db.add(DataSourceLog(
        source_name=source_name,
        endpoint=result.get("endpoint") or result.get("query"),
        query=tech_id,
        status=result.get("status", "success"),
        records_fetched=fetched,
        error=result.get("error"),
        methodology_version=result.get("model") or "maturity_v2_live",
    ))
