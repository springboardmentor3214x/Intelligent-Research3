"""
backend/app/routers/funding.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Funding API router stub.
──────────────────────────────────────────────────────────────────────────────
OWNERSHIP NOTE:
  Member 4 (Kaviya) owns this file only until Member 5 takes over the full
  Search / DB / FastAPI layer. The stub below exposes the agreed endpoint
  skeleton so Member 5 can fill in the implementation without re-creating
  the route signatures.

  Member 5 MUST implement:
    GET  /api/funding                    → paginated list with filters
    GET  /api/funding/{funding_id}       → funding details
    POST /api/funding/search             → keyword + filter search
    GET  /api/funding/recommendations    → AI-matched recommendations (Member 6)
    POST /api/funding/save               → save for authenticated user
    GET  /api/funding/saved              → list saved for authenticated user
    DELETE /api/funding/saved/{id}       → unsave

  Member 5 should add authentication using the existing Module 1 mechanism.
──────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.funding import FundingOpportunity
from app.schemas.funding import FundingOpportunityListResponse, FundingOpportunityRead

router = APIRouter()


# ── Health / status ───────────────────────────────────────────────────────────

@router.get("/status", summary="Funding module status")
def funding_status(db: Session = Depends(get_db)):
    """
    Quick status endpoint — returns count of ingested opportunities.
    Useful for verifying the ingestion pipeline has run successfully.
    """
    count = db.scalar(
        select(FundingOpportunity).with_only_columns(
            FundingOpportunity.id
        ).order_by(None)
    )
    total = db.query(FundingOpportunity).count()
    return {
        "module": "funding",
        "status": "operational",
        "total_opportunities": total,
    }


# ── List opportunities (stub — Member 5 implements filters + pagination) ──────

@router.get(
    "",
    response_model=FundingOpportunityListResponse,
    summary="List funding opportunities (stub)",
)
def list_funding(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    """
    Returns a paginated list of funding opportunities.
    ⚠ Stub — Member 5 will add keyword, research_area, country, deadline filters.
    """
    offset = (page - 1) * page_size
    total = db.query(FundingOpportunity).count()
    items = (
        db.query(FundingOpportunity)
        .order_by(FundingOpportunity.deadline.asc().nullslast())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return FundingOpportunityListResponse(
        items=[FundingOpportunityRead.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


# ── Detail endpoint (stub) ────────────────────────────────────────────────────

@router.get(
    "/{funding_id}",
    response_model=FundingOpportunityRead,
    summary="Get funding opportunity by ID (stub)",
)
def get_funding(
    funding_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns a single funding opportunity by its database ID.
    ⚠ Stub — Member 5 will add authentication and richer error handling.
    """
    record = db.get(FundingOpportunity, funding_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Funding opportunity not found.")
    return FundingOpportunityRead.model_validate(record)
