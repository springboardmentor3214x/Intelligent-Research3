"""
Funding Router — Module 4.

Endpoints:
  GET  /api/funding                     — list / search funding
  GET  /api/funding/saved               — user's saved funding
  GET  /api/funding/recommendations     — ranked recommendations
  GET  /api/funding/{funding_id}        — funding detail
  POST /api/funding/search              — POST search with body
  POST /api/funding/match               — match score for one opportunity
  POST /api/funding/save                — save a funding opportunity
  DELETE /api/funding/saved/{funding_id} — unsave funding
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.funding import SavedFundingOpportunity
from app.models.user import User
from app.repositories.funding_repository import (
    get_funding_by_id,
    get_funding_by_ids,
    get_saved_funding,
    is_funding_saved,
    save_funding,
    search_funding_opportunities,
    unsave_funding,
)
from app.schemas.funding import FundingMatchRequest, FundingSearchRequest
from app.services.funding_matching_service import (
    get_funding_recommendations,
    match_funding,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Funding Opportunities — Module 4"])


# ---------------------------------------------------------------------------
# Serializer helper
# ---------------------------------------------------------------------------

def _opp_to_dict(opp, is_saved: bool = False) -> dict:
    return {
        "id": opp.id,
        "external_id": opp.external_id,
        "source": opp.source,
        "title": opp.title,
        "organization": opp.organization,
        "description": opp.description,
        "funding_amount": opp.funding_amount,
        "funding_amount_min": opp.funding_amount_min,
        "funding_amount_max": opp.funding_amount_max,
        "currency": opp.currency,
        "deadline": opp.deadline.isoformat() if opp.deadline else None,
        "status": opp.status,
        "funding_type": opp.funding_type,
        "country": opp.country,
        "research_areas": opp.get_research_areas(),
        "keywords": opp.get_keywords(),
        "eligibility": opp.eligibility,
        "source_url": opp.source_url,
        "application_url": opp.application_url,
        "is_saved": is_saved,
        "created_at": opp.created_at.isoformat(),
        "updated_at": opp.updated_at.isoformat(),
    }


# ============================================================
# LIST / SEARCH (GET)
# ============================================================

@router.get("/api/funding", summary="List and search funding opportunities")
def list_funding(
    q: Optional[str] = Query(None, alias="query", description="Keyword search"),
    research_area: Optional[str] = Query(None),
    organization: Optional[str] = Query(None),
    funding_type: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    status: Optional[str] = Query("open"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("deadline"),
    sort_order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all open funding opportunities with optional filters."""
    items, total = search_funding_opportunities(
        db=db,
        query=q,
        research_area=research_area,
        organization=organization,
        funding_type=funding_type,
        country=country,
        status=status,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    saved_ids = {
        s.funding_id
        for s in db.query(SavedFundingOpportunity)
        .filter_by(user_id=current_user.id)
        .all()
    } if items else set()

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "success": True,
        "data": {
            "items": [_opp_to_dict(opp, is_saved=(opp.id in saved_ids)) for opp in items],
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


# ============================================================
# POST SEARCH
# ============================================================

@router.post("/api/funding/search", summary="Advanced funding search")
def search_funding_post(
    body: FundingSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST search with full filter body.
    Supports all filters including date ranges and amount ranges.
    """
    items, total = search_funding_opportunities(
        db=db,
        query=body.query,
        research_area=body.research_area,
        organization=body.organization,
        funding_type=body.funding_type,
        country=body.country,
        amount_min=body.amount_min,
        amount_max=body.amount_max,
        deadline_from=body.deadline_from,
        deadline_to=body.deadline_to,
        status=body.status,
        page=body.page,
        page_size=body.page_size,
        sort_by=body.sort_by,
        sort_order=body.sort_order,
    )

    total_pages = (total + body.page_size - 1) // body.page_size if total > 0 else 0

    return {
        "success": True,
        "data": {
            "items": [_opp_to_dict(opp) for opp in items],
            "page": body.page,
            "page_size": body.page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


# ============================================================
# SAVED FUNDING
# ============================================================

@router.get("/api/funding/saved", summary="Get saved funding opportunities")
def get_my_saved_funding(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated user's saved funding opportunities."""
    items, total = get_saved_funding(db, user_id=current_user.id, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "success": True,
        "data": {
            "items": [_opp_to_dict(opp, is_saved=True) for opp in items],
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


# ============================================================
# RECOMMENDATIONS
# ============================================================

@router.get("/api/funding/recommendations", summary="Profile-based funding recommendations")
def funding_recommendations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return ranked funding opportunities based on the authenticated user's
    Module 2 research profile.

    Changing profile keywords/areas changes the ranking.
    """
    result = get_funding_recommendations(db, user=current_user, page=page, page_size=page_size)
    return {"success": True, "data": result}


# ============================================================
# MATCH SCORE
# ============================================================

@router.post("/api/funding/match", summary="Calculate match score for a funding opportunity")
def calculate_match(
    body: FundingMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate transparent match score between a researcher profile
    and a specific funding opportunity.

    Score is fully explainable — no black-box AI.
    """
    try:
        result = match_funding(
            db=db,
            funding_id=body.funding_id,
            research_domain=[body.research_domain] if body.research_domain else [],
            research_areas=body.research_areas,
            keywords=body.keywords,
            user_country=current_user.country,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return {"success": True, "data": result}


# ============================================================
# COMPARISON
# ============================================================

@router.get("/api/funding/compare", summary="Compare multiple funding opportunities")
def compare_funding(
    ids: str = Query(..., description="Comma-separated funding IDs to compare"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return side-by-side data for multiple funding opportunities.
    Pass comma-separated IDs: ?ids=1,2,3
    """
    try:
        id_list = [int(x.strip()) for x in ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid funding IDs format. Use comma-separated integers.")

    if not id_list:
        raise HTTPException(status_code=400, detail="At least one funding ID is required.")

    if len(id_list) > 5:
        raise HTTPException(status_code=400, detail="Cannot compare more than 5 opportunities at once.")

    items = get_funding_by_ids(db, id_list)
    if not items:
        raise HTTPException(status_code=404, detail="No funding opportunities found for the given IDs.")

    return {
        "success": True,
        "data": {
            "items": [_opp_to_dict(opp) for opp in items],
            "comparison_fields": [
                "title", "organization", "funding_amount", "funding_amount_max",
                "currency", "deadline", "funding_type", "country", "research_areas",
                "keywords", "eligibility", "status", "application_url",
            ],
        },
    }


# ============================================================
# DETAIL
# ============================================================

@router.get("/api/funding/{funding_id}", summary="Get funding opportunity details")
def get_funding_detail(
    funding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full details for a single funding opportunity."""
    opp = get_funding_by_id(db, funding_id)
    if opp is None:
        raise HTTPException(status_code=404, detail="Funding opportunity not found.")

    saved = is_funding_saved(db, user_id=current_user.id, funding_id=funding_id)

    return {"success": True, "data": _opp_to_dict(opp, is_saved=saved)}


# ============================================================
# SAVE
# ============================================================

@router.post("/api/funding/save", summary="Save a funding opportunity", status_code=201)
def save_funding_opportunity(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a funding opportunity. Body: {"funding_id": 123}"""
    funding_id = body.get("funding_id")
    if not funding_id or not isinstance(funding_id, int):
        raise HTTPException(status_code=400, detail="funding_id is required and must be an integer.")

    try:
        record, created = save_funding(db, user_id=current_user.id, funding_id=funding_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    if not created:
        raise HTTPException(status_code=409, detail="Funding opportunity is already saved.")

    return {
        "success": True,
        "message": "Funding opportunity saved.",
        "data": {"funding_id": funding_id, "saved": True},
    }


# ============================================================
# UNSAVE
# ============================================================

@router.delete("/api/funding/saved/{funding_id}", summary="Unsave a funding opportunity")
def unsave_funding_opportunity(
    funding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a funding opportunity from the user's saved list."""
    deleted = unsave_funding(db, user_id=current_user.id, funding_id=funding_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Funding opportunity was not saved.")

    return {
        "success": True,
        "message": "Funding opportunity unsaved.",
        "data": {"funding_id": funding_id, "saved": False},
    }
