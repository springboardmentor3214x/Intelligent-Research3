"""
backend/app/routers/dashboard.py
Module 9 — Dashboard & Analytics REST API

Aggregates data from Modules 1-8 and provides analytics endpoints.

Endpoints:
    GET /api/dashboard/summary           — Platform-wide KPI summary
    GET /api/dashboard/research          — Research analytics (publications, areas)
    GET /api/dashboard/patents           — Patent analytics
    GET /api/dashboard/funding           — Funding analytics
    GET /api/dashboard/innovation        — Innovation analytics
    GET /api/dashboard/technology        — Technology intelligence analytics
    GET /api/dashboard/commercialization — Commercialization analytics
    GET /api/dashboard/activity          — Recent activity across modules
    GET /api/dashboard/users             — User/role breakdown (admin only)
"""

import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, desc, text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User, RoleEnum

# Import the CORRECT profile models (app.models.profile, not app.models.research_profile)
from app.models.profile import ResearchProfile, Publication, Patent, ResearchTag, TagKind

# Import technology and intelligence models
from app.models.technology import (
    Technology, TechnologyMaturity, TechnologyTrend, TechnologyOpportunity
)
from app.models.innovation_score import InnovationScore
from app.models.commercialization import CommercializationRecommendation
from app.models.funding import FundingOpportunity

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Module 9 - Dashboard & Analytics"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _role_label(role: str) -> str:
    """Normalize role string to canonical label."""
    r = (role or "").strip().lower()
    mapping = {
        "researcher": "Researcher",
        "startup founder": "Startup Founder",
        "startup_founder": "Startup Founder",
        "innovation manager": "Innovation Manager",
        "innovation_manager": "Innovation Manager",
        "administrator": "Administrator",
        "admin": "Administrator",
    }
    return mapping.get(r, role)


def _is_admin(user: User) -> bool:
    return (user.role or "").strip().lower() in ("administrator", "admin")


def _get_profile_id(db: Session, user_id: int) -> Optional[int]:
    """Get profile id for a given user_id, or None."""
    profile = db.query(ResearchProfile).filter(ResearchProfile.user_id == user_id).first()
    return profile.id if profile else None


# ── Summary (KPI Overview) ─────────────────────────────────────────────────────

@router.get("/summary", summary="Platform-wide KPI summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated KPIs across all modules.
    Admins see global counts; non-admins see their own data counts.
    """
    admin = _is_admin(current_user)
    user_id = current_user.id

    result: Dict[str, Any] = {}

    # ── Users (Module 1) ──────────────────────────────────────────────────────
    try:
        result["total_users"] = db.query(User).count()
        result["active_users"] = db.query(User).filter(User.is_active == True).count()
    except Exception as e:
        logger.warning("Dashboard summary: users error: %s", e)
        result["total_users"] = None
        result["active_users"] = None

    # ── Research Profiles & Publications & Patents (Module 2) ─────────────────
    try:
        if admin:
            result["total_profiles"] = db.query(ResearchProfile).count()
            result["total_publications"] = db.query(Publication).count()
            result["total_patents"] = db.query(Patent).count()
        else:
            pid = _get_profile_id(db, user_id)
            result["total_profiles"] = 1 if pid else 0
            result["total_publications"] = (
                db.query(Publication).filter(Publication.profile_id == pid).count()
                if pid else 0
            )
            result["total_patents"] = (
                db.query(Patent).filter(Patent.profile_id == pid).count()
                if pid else 0
            )
    except Exception as e:
        logger.warning("Dashboard summary: profiles error: %s", e)
        result["total_profiles"] = None
        result["total_publications"] = None
        result["total_patents"] = None

    # ── Funding (Module 4) ────────────────────────────────────────────────────
    try:
        result["total_funding_opportunities"] = db.query(FundingOpportunity).count()
        result["active_funding_opportunities"] = (
            db.query(FundingOpportunity).filter(FundingOpportunity.status == "active").count()
        )
    except Exception as e:
        logger.warning("Dashboard summary: funding error: %s", e)
        result["total_funding_opportunities"] = None
        result["active_funding_opportunities"] = None

    # ── Technologies (Module 6) ───────────────────────────────────────────────
    try:
        result["total_technologies"] = db.query(Technology).count()
        result["total_innovation_opportunities"] = db.query(TechnologyOpportunity).count()
        result["emerging_technologies"] = (
            db.query(TechnologyMaturity).filter(TechnologyMaturity.stage == "Emerging").count()
        )
    except Exception as e:
        logger.warning("Dashboard summary: technology error: %s", e)
        result["total_technologies"] = None
        result["total_innovation_opportunities"] = None
        result["emerging_technologies"] = None

    # ── Innovation Scores (Module 7) ─────────────────────────────────────────
    try:
        result["total_innovation_scores"] = db.query(InnovationScore).count()
        avg_row = db.query(func.avg(InnovationScore.innovation_score)).scalar()
        result["avg_innovation_score"] = round(float(avg_row), 1) if avg_row else None
    except Exception as e:
        logger.warning("Dashboard summary: innovation score error: %s", e)
        result["total_innovation_scores"] = None
        result["avg_innovation_score"] = None

    # ── Commercialization (Module 8) ─────────────────────────────────────────
    try:
        result["total_commercialization_recommendations"] = (
            db.query(CommercializationRecommendation).count()
        )
    except Exception as e:
        logger.warning("Dashboard summary: commercialization error: %s", e)
        result["total_commercialization_recommendations"] = None

    # ── Research Papers (Module 3) ────────────────────────────────────────────
    try:
        from app.models.research_paper import ResearchPaper
        result["total_research_papers"] = db.query(ResearchPaper).count()
    except Exception as e:
        result["total_research_papers"] = None

    result["generated_at"] = datetime.now(timezone.utc).isoformat()
    result["user_role"] = _role_label(current_user.role)
    return result


# ── Research Analytics (Modules 2 & 3) ────────────────────────────────────────

@router.get("/research", summary="Research analytics")
def get_research_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns publication analytics, research areas breakdown, and citation stats.
    """
    admin = _is_admin(current_user)
    user_id = current_user.id
    result: Dict[str, Any] = {}

    try:
        if admin:
            pubs_q = db.query(Publication)
            patents_q = db.query(Patent)
            areas_q = db.query(ResearchTag).filter(ResearchTag.kind == TagKind.RESEARCH_AREA.value)
            kws_q = db.query(ResearchTag).filter(ResearchTag.kind == TagKind.RESEARCH_KEYWORD.value)
        else:
            pid = _get_profile_id(db, user_id)
            if pid is None:
                result["publications_by_year"] = []
                result["research_areas"] = []
                result["top_keywords"] = []
                result["recent_publications"] = []
                result["total_publications"] = 0
                result["total_patents"] = 0
                return result
            pubs_q = db.query(Publication).filter(Publication.profile_id == pid)
            patents_q = db.query(Patent).filter(Patent.profile_id == pid)
            areas_q = db.query(ResearchTag).filter(
                ResearchTag.profile_id == pid,
                ResearchTag.kind == TagKind.RESEARCH_AREA.value
            )
            kws_q = db.query(ResearchTag).filter(
                ResearchTag.profile_id == pid,
                ResearchTag.kind == TagKind.RESEARCH_KEYWORD.value
            )

        publications = pubs_q.all()

        # Publications by year (using publication_date)
        year_counts: Dict[int, int] = defaultdict(int)
        for pub in publications:
            if pub.publication_date:
                year_counts[pub.publication_date.year] += 1
        publications_by_year = sorted(
            [{"year": y, "count": c} for y, c in year_counts.items()],
            key=lambda x: x["year"],
        )

        # Research areas from tags
        areas = [t.value for t in areas_q.all() if t.value]

        # Keywords from tags
        keywords = [t.value for t in kws_q.all() if t.value]

        # Recent publications
        recent_pubs = sorted(
            publications,
            key=lambda p: p.publication_date or datetime.min.date(),
            reverse=True,
        )[:10]

        result["publications_by_year"] = publications_by_year
        result["research_areas"] = areas
        result["top_keywords"] = keywords[:20]
        result["recent_publications"] = [
            {
                "id": p.id,
                "title": p.publication_title,
                "journal": p.journal_or_conference,
                "year": p.publication_date.year if p.publication_date else None,
                "doi": p.doi,
                "domain": p.research_domain,
            }
            for p in recent_pubs
        ]
        result["total_publications"] = len(publications)
        result["total_patents"] = patents_q.count()

    except Exception as e:
        logger.warning("Dashboard research analytics error: %s", e)
        result["error"] = "Unable to load research analytics"
        result.setdefault("publications_by_year", [])
        result.setdefault("research_areas", [])
        result.setdefault("top_keywords", [])
        result.setdefault("recent_publications", [])

    # ── Research Papers from Module 3 (OpenAlex) ─────────────────────────────
    try:
        from app.models.research_paper import ResearchPaper
        paper_count = db.query(ResearchPaper).count()
        recent_papers = (
            db.query(ResearchPaper)
            .order_by(desc(ResearchPaper.publication_year))
            .limit(5)
            .all()
        )
        result["research_papers_count"] = paper_count
        result["recent_research_papers"] = [
            {
                "id": p.id,
                "title": p.title,
                "year": p.publication_year,
                "citations": getattr(p, "cited_by_count", None),
                "source": "OpenAlex",
            }
            for p in recent_papers
        ]
    except Exception as e:
        logger.warning("Dashboard: research papers error: %s", e)
        result["research_papers_count"] = None
        result["recent_research_papers"] = []

    return result


# ── Patent Analytics ───────────────────────────────────────────────────────────

@router.get("/patents", summary="Patent analytics")
def get_patent_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns patent counts, filing trends, and status breakdown."""
    admin = _is_admin(current_user)
    user_id = current_user.id
    result: Dict[str, Any] = {}

    try:
        if admin:
            patents = db.query(Patent).all()
        else:
            pid = _get_profile_id(db, user_id)
            patents = (
                db.query(Patent).filter(Patent.profile_id == pid).all()
                if pid else []
            )

        # Status breakdown (using patent_status field)
        status_counts: Dict[str, int] = defaultdict(int)
        for p in patents:
            s = (p.patent_status or "Unknown").strip()
            status_counts[s] += 1

        # Filing by year (using filing_date)
        year_counts: Dict[int, int] = defaultdict(int)
        for p in patents:
            if p.filing_date:
                year_counts[p.filing_date.year] += 1

        result["total_patents"] = len(patents)
        result["status_breakdown"] = [
            {"status": s, "count": c} for s, c in sorted(status_counts.items())
        ]
        result["patents_by_year"] = sorted(
            [{"year": y, "count": c} for y, c in year_counts.items()],
            key=lambda x: x["year"],
        )
        result["recent_patents"] = [
            {
                "id": p.id,
                "title": p.patent_title,
                "patent_number": p.patent_number,
                "status": p.patent_status,
                "filing_date": p.filing_date.isoformat() if p.filing_date else None,
                "domain": p.patent_domain,
            }
            for p in sorted(patents, key=lambda p: p.filing_date or datetime.min.date(), reverse=True)[:10]
        ]

    except Exception as e:
        logger.warning("Dashboard patent analytics error: %s", e)
        result["error"] = "Unable to load patent analytics"
        result.setdefault("total_patents", 0)
        result.setdefault("status_breakdown", [])
        result.setdefault("patents_by_year", [])
        result.setdefault("recent_patents", [])

    return result


# ── Funding Analytics (Module 4) ───────────────────────────────────────────────

@router.get("/funding", summary="Funding analytics")
def get_funding_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns funding opportunity breakdown by type, status, country, and source."""
    result: Dict[str, Any] = {}

    try:
        all_funding = db.query(FundingOpportunity).all()
        total = len(all_funding)

        status_counts: Dict[str, int] = defaultdict(int)
        type_counts: Dict[str, int] = defaultdict(int)
        source_counts: Dict[str, int] = defaultdict(int)
        country_counts: Dict[str, int] = defaultdict(int)

        for f in all_funding:
            status_counts[f.status or "unknown"] += 1
            type_counts[f.funding_type or "other"] += 1
            source_counts[f.source or "unknown"] += 1
            country_counts[f.country or "unknown"] += 1

        now = datetime.now(timezone.utc)
        upcoming = sorted(
            [f for f in all_funding if f.status == "active" and f.deadline and f.deadline > now],
            key=lambda x: x.deadline,
        )[:10]

        result["total_funding_opportunities"] = total
        result["status_breakdown"] = [
            {"status": s, "count": c} for s, c in sorted(status_counts.items())
        ]
        result["type_breakdown"] = [
            {"type": t, "count": c}
            for t, c in sorted(type_counts.items(), key=lambda x: -x[1])
        ]
        result["source_breakdown"] = [
            {"source": s, "count": c}
            for s, c in sorted(source_counts.items(), key=lambda x: -x[1])
        ]
        result["country_breakdown"] = [
            {"country": c, "count": n}
            for c, n in sorted(country_counts.items(), key=lambda x: -x[1])
        ][:10]
        result["upcoming_deadlines"] = [
            {
                "id": f.id,
                "title": f.title,
                "organization": f.organization,
                "deadline": f.deadline.isoformat() if f.deadline else None,
                "funding_type": f.funding_type,
                "source": f.source,
                "funding_amount": float(f.funding_amount) if f.funding_amount else None,
                "currency": f.currency,
            }
            for f in upcoming
        ]

    except Exception as e:
        logger.warning("Dashboard funding analytics error: %s", e)
        result["error"] = "Unable to load funding analytics"
        result.setdefault("total_funding_opportunities", 0)
        result.setdefault("status_breakdown", [])
        result.setdefault("type_breakdown", [])
        result.setdefault("source_breakdown", [])
        result.setdefault("country_breakdown", [])
        result.setdefault("upcoming_deadlines", [])

    return result


# ── Innovation Analytics (Module 7) ───────────────────────────────────────────

@router.get("/innovation", summary="Innovation analytics")
def get_innovation_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns innovation scores, factor breakdowns, and lifecycle distribution."""
    result: Dict[str, Any] = {}

    try:
        scores = db.query(InnovationScore).all()

        if not scores:
            result["total_scored_technologies"] = 0
            result["avg_innovation_score"] = None
            result["scores_list"] = []
            result["lifecycle_distribution"] = []
            result["factor_averages"] = {}
            result["top_scored_technologies"] = []
            return result

        valid_scores = [s.innovation_score for s in scores if s.innovation_score is not None]
        avg_score = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else None

        lifecycle_counts: Dict[str, int] = defaultdict(int)
        for s in scores:
            lifecycle_counts[s.lifecycle or "Unknown"] += 1

        factor_buckets = {
            "research_novelty": [],
            "patent_strength": [],
            "technology_maturity": [],
            "market_potential": [],
            "funding_relevance": [],
        }
        for s in scores:
            for factor in factor_buckets:
                val = getattr(s, factor, None)
                if val is not None:
                    factor_buckets[factor].append(val)

        factor_avgs = {
            k: round(sum(v) / len(v), 1) if v else None
            for k, v in factor_buckets.items()
        }

        top_scored = sorted(
            [s for s in scores if s.innovation_score is not None],
            key=lambda x: x.innovation_score,
            reverse=True,
        )[:10]

        result["total_scored_technologies"] = len(scores)
        result["avg_innovation_score"] = avg_score
        result["lifecycle_distribution"] = [
            {"lifecycle": lc, "count": c}
            for lc, c in sorted(lifecycle_counts.items(), key=lambda x: -x[1])
        ]
        result["factor_averages"] = factor_avgs
        result["top_scored_technologies"] = [
            {
                "technology_id": s.technology_id,
                "innovation_score": s.innovation_score,
                "lifecycle": s.lifecycle,
                "research_novelty": s.research_novelty,
                "patent_strength": s.patent_strength,
                "technology_maturity": s.technology_maturity,
                "market_potential": s.market_potential,
                "funding_relevance": s.funding_relevance,
            }
            for s in top_scored
        ]
        result["scores_list"] = [
            {
                "technology_id": s.technology_id,
                "innovation_score": s.innovation_score,
                "status": s.status,
                "lifecycle": s.lifecycle,
                "data_completeness": s.data_completeness,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in scores
        ]

    except Exception as e:
        logger.warning("Dashboard innovation analytics error: %s", e)
        result["error"] = "Unable to load innovation analytics"

    return result


# ── Technology Analytics (Module 6) ───────────────────────────────────────────

@router.get("/technology", summary="Technology intelligence analytics")
def get_technology_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns technology trends, maturity distribution, and opportunity breakdown."""
    result: Dict[str, Any] = {}

    try:
        technologies = db.query(Technology).all()
        total = len(technologies)

        if not technologies:
            result["total_technologies"] = 0
            result["stage_distribution"] = []
            result["opportunity_types"] = []
            result["technologies_list"] = []
            result["domain_breakdown"] = []
            result["research_direction_distribution"] = []
            result["total_opportunities"] = 0
            return result

        stage_counts: Dict[str, int] = defaultdict(int)
        direction_counts: Dict[str, int] = defaultdict(int)
        domain_counts: Dict[str, int] = defaultdict(int)

        for tech in technologies:
            m = tech.maturity
            t = tech.trend
            stage_counts[m.stage if m else "Unknown"] += 1
            direction_counts[(t.research_direction if t else None) or "Insufficient Data"] += 1
            domain_counts[tech.domain or "Unknown"] += 1

        all_opps = db.query(TechnologyOpportunity).all()
        opp_type_counts: Dict[str, int] = defaultdict(int)
        for opp in all_opps:
            opp_type_counts[opp.opportunity_type or "other"] += 1

        tech_list = []
        for tech in technologies:
            m = tech.maturity
            t = tech.trend
            tech_list.append({
                "id": tech.technology_id,
                "name": tech.name,
                "domain": tech.domain,
                "stage": m.stage if m else None,
                "score": m.score if m else None,
                "research_direction": t.research_direction if t else None,
                "patent_direction": t.patent_direction if t else None,
                "is_demo": tech.is_demo,
            })

        result["total_technologies"] = total
        result["stage_distribution"] = [
            {"stage": s, "count": c}
            for s, c in sorted(stage_counts.items(), key=lambda x: -x[1])
        ]
        result["research_direction_distribution"] = [
            {"direction": d, "count": c}
            for d, c in sorted(direction_counts.items(), key=lambda x: -x[1])
        ]
        result["opportunity_types"] = [
            {"type": t, "count": c}
            for t, c in sorted(opp_type_counts.items(), key=lambda x: -x[1])
        ]
        result["domain_breakdown"] = [
            {"domain": d, "count": c}
            for d, c in sorted(domain_counts.items(), key=lambda x: -x[1])
        ]
        result["technologies_list"] = tech_list
        result["total_opportunities"] = len(all_opps)

    except Exception as e:
        logger.warning("Dashboard technology analytics error: %s", e)
        result["error"] = "Unable to load technology analytics"

    return result


# ── Commercialization Analytics (Module 8) ─────────────────────────────────────

@router.get("/commercialization", summary="Commercialization analytics")
def get_commercialization_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns commercialization pathway breakdown, readiness scores, and top recommendations."""
    result: Dict[str, Any] = {}

    try:
        recs = db.query(CommercializationRecommendation).all()

        if not recs:
            result["total_recommendations"] = 0
            result["avg_readiness_score"] = None
            result["lifecycle_distribution"] = []
            result["pathway_avg_scores"] = {}
            result["top_recommendations"] = []
            return result

        total = len(recs)
        readiness_vals = [r.commercialization_readiness for r in recs if r.commercialization_readiness is not None]
        avg_readiness = round(sum(readiness_vals) / len(readiness_vals), 1) if readiness_vals else None

        lifecycle_counts: Dict[str, int] = defaultdict(int)
        for r in recs:
            lifecycle_counts[r.lifecycle or "Unknown"] += 1

        pathway_scores: Dict[str, List[float]] = {
            "productization": [],
            "licensing": [],
            "startup": [],
            "industry_partnership": [],
        }
        for r in recs:
            for path_key in pathway_scores:
                path_obj = getattr(r, path_key, None)
                if isinstance(path_obj, dict):
                    score = path_obj.get("score") or path_obj.get("potential_score")
                    if score is not None:
                        try:
                            pathway_scores[path_key].append(float(score))
                        except (ValueError, TypeError):
                            pass

        pathway_avgs = {
            k: round(sum(v) / len(v), 1) if v else None
            for k, v in pathway_scores.items()
        }

        top_recs = sorted(
            [r for r in recs if r.commercialization_readiness is not None],
            key=lambda x: x.commercialization_readiness,
            reverse=True,
        )[:10]

        result["total_recommendations"] = total
        result["avg_readiness_score"] = avg_readiness
        result["lifecycle_distribution"] = [
            {"lifecycle": lc, "count": c}
            for lc, c in sorted(lifecycle_counts.items(), key=lambda x: -x[1])
        ]
        result["pathway_avg_scores"] = pathway_avgs
        result["top_recommendations"] = [
            {
                "technology_id": r.technology_id,
                "commercialization_readiness": r.commercialization_readiness,
                "innovation_score": r.innovation_score,
                "lifecycle": r.lifecycle,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in top_recs
        ]

    except Exception as e:
        logger.warning("Dashboard commercialization analytics error: %s", e)
        result["error"] = "Unable to load commercialization analytics"

    return result


# ── Activity Feed ──────────────────────────────────────────────────────────────

@router.get("/activity", summary="Recent platform activity")
def get_recent_activity(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a merged, time-sorted feed of recent activity across all modules."""
    admin = _is_admin(current_user)
    user_id = current_user.id
    activity: List[Dict[str, Any]] = []

    # Recent publications
    try:
        if admin:
            pubs = db.query(Publication).order_by(desc(Publication.created_at)).limit(limit).all()
        else:
            pid = _get_profile_id(db, user_id)
            pubs = (
                db.query(Publication)
                .filter(Publication.profile_id == pid)
                .order_by(desc(Publication.created_at))
                .limit(limit)
                .all()
                if pid else []
            )
        for p in pubs:
            activity.append({
                "type": "publication",
                "module": "Module 2",
                "title": p.publication_title,
                "detail": f"{p.journal_or_conference or ''} • {p.publication_date.year if p.publication_date else ''}",
                "timestamp": p.created_at.isoformat() if p.created_at else None,
                "icon": "book",
            })
    except Exception as e:
        logger.debug("Activity: publications error: %s", e)

    # Recent patents
    try:
        if admin:
            pats = db.query(Patent).order_by(desc(Patent.created_at)).limit(limit).all()
        else:
            pid = _get_profile_id(db, user_id)
            pats = (
                db.query(Patent)
                .filter(Patent.profile_id == pid)
                .order_by(desc(Patent.created_at))
                .limit(limit)
                .all()
                if pid else []
            )
        for p in pats:
            activity.append({
                "type": "patent",
                "module": "Module 5",
                "title": p.patent_title,
                "detail": f"{p.patent_number or 'Pending'} • {p.patent_status or 'Unknown'}",
                "timestamp": p.created_at.isoformat() if p.created_at else None,
                "icon": "file-key",
            })
    except Exception as e:
        logger.debug("Activity: patents error: %s", e)

    # Recent innovation scores
    try:
        scores = (
            db.query(InnovationScore)
            .order_by(desc(InnovationScore.created_at))
            .limit(10)
            .all()
        )
        for s in scores:
            activity.append({
                "type": "innovation_score",
                "module": "Module 7",
                "title": f"Innovation Score: {s.technology_id}",
                "detail": f"Score: {s.innovation_score or 'N/A'} • {s.lifecycle or ''}",
                "timestamp": s.created_at.isoformat() if s.created_at else None,
                "icon": "award",
            })
    except Exception as e:
        logger.debug("Activity: innovation scores error: %s", e)

    # Recent commercialization recommendations
    try:
        comm_recs = (
            db.query(CommercializationRecommendation)
            .order_by(desc(CommercializationRecommendation.created_at))
            .limit(10)
            .all()
        )
        for r in comm_recs:
            activity.append({
                "type": "commercialization",
                "module": "Module 8",
                "title": f"Commercialization: {r.technology_id}",
                "detail": f"Readiness: {r.commercialization_readiness or 'N/A'} • {r.lifecycle or ''}",
                "timestamp": r.created_at.isoformat() if r.created_at else None,
                "icon": "dollar-sign",
            })
    except Exception as e:
        logger.debug("Activity: commercialization error: %s", e)

    # Recent active funding opportunities
    try:
        funding = (
            db.query(FundingOpportunity)
            .filter(FundingOpportunity.status == "active")
            .order_by(desc(FundingOpportunity.created_at))
            .limit(10)
            .all()
        )
        for f in funding:
            activity.append({
                "type": "funding",
                "module": "Module 4",
                "title": f.title,
                "detail": f"{f.organization} • {f.funding_type}",
                "timestamp": f.created_at.isoformat() if f.created_at else None,
                "icon": "search",
            })
    except Exception as e:
        logger.debug("Activity: funding error: %s", e)

    activity_sorted = sorted(
        activity,
        key=lambda x: x["timestamp"] or "0000",
        reverse=True,
    )[:limit]

    return {
        "activity": activity_sorted,
        "total": len(activity_sorted),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ── Users & Roles (Admin Only) ─────────────────────────────────────────────────

@router.get("/users", summary="User and role breakdown (admin only)")
def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns user breakdown by role. Admin-only."""
    if not _is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for user analytics.",
        )

    result: Dict[str, Any] = {}

    try:
        all_users = db.query(User).all()
        total = len(all_users)
        active = sum(1 for u in all_users if u.is_active)

        role_counts: Dict[str, int] = defaultdict(int)
        for u in all_users:
            role_counts[_role_label(u.role)] += 1

        month_counts: Dict[str, int] = defaultdict(int)
        for u in all_users:
            if u.created_at:
                key = u.created_at.strftime("%Y-%m")
                month_counts[key] += 1

        result["total_users"] = total
        result["active_users"] = active
        result["inactive_users"] = total - active
        result["role_distribution"] = [
            {"role": r, "count": c}
            for r, c in sorted(role_counts.items(), key=lambda x: -x[1])
        ]
        result["registrations_by_month"] = sorted(
            [{"month": m, "count": c} for m, c in month_counts.items()],
            key=lambda x: x["month"],
        )
        result["recent_users"] = [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": _role_label(u.role),
                "is_active": u.is_active,
                "organization": u.organization,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in sorted(all_users, key=lambda x: x.created_at or datetime.min, reverse=True)[:10]
        ]

    except Exception as e:
        logger.warning("Dashboard user analytics error: %s", e)
        result["error"] = "Unable to load user analytics"

    return result
