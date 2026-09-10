"""
Funding Repository — Module 4.

All DB CRUD for FundingOpportunity and SavedFundingOpportunity.
"""
import json
from datetime import date
from typing import Optional

from sqlalchemy import asc, cast, desc, nulls_last, or_, String
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.funding import FundingOpportunity, SavedFundingOpportunity


# ---------------------------------------------------------------------------
# Search / List
# ---------------------------------------------------------------------------

def search_funding_opportunities(
    db: Session,
    query: Optional[str] = None,
    research_area: Optional[str] = None,
    organization: Optional[str] = None,
    funding_type: Optional[str] = None,
    country: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
    deadline_from: Optional[date] = None,
    deadline_to: Optional[date] = None,
    status: Optional[str] = "open",
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "deadline",
    sort_order: str = "asc",
) -> tuple[list[FundingOpportunity], int]:
    """Search and filter funding opportunities with pagination."""
    q = db.query(FundingOpportunity)

    if query:
        term = f"%{query.strip()}%"
        q = q.filter(
            or_(
                FundingOpportunity.title.ilike(term),
                FundingOpportunity.description.ilike(term),
                FundingOpportunity.organization.ilike(term),
                cast(FundingOpportunity.keywords, String).ilike(term),
                cast(FundingOpportunity.research_areas, String).ilike(term),
            )
        )

    if research_area:
        q = q.filter(cast(FundingOpportunity.research_areas, String).ilike(f"%{research_area.strip()}%"))

    if organization:
        q = q.filter(FundingOpportunity.organization.ilike(f"%{organization.strip()}%"))

    if funding_type:
        q = q.filter(FundingOpportunity.funding_type.ilike(f"%{funding_type.strip()}%"))

    if country:
        q = q.filter(FundingOpportunity.country.ilike(f"%{country.strip()}%"))

    if amount_min is not None:
        q = q.filter(
            or_(
                FundingOpportunity.funding_amount >= amount_min,
                FundingOpportunity.funding_amount_max >= amount_min,
            )
        )

    if amount_max is not None:
        q = q.filter(
            or_(
                FundingOpportunity.funding_amount <= amount_max,
                FundingOpportunity.funding_amount_max <= amount_max,
            )
        )

    if deadline_from:
        q = q.filter(FundingOpportunity.deadline >= deadline_from)

    if deadline_to:
        q = q.filter(FundingOpportunity.deadline <= deadline_to)

    if status and status.strip() and status.strip().lower() not in ("all", "any"):
        q = q.filter(FundingOpportunity.status.ilike(status.strip()))

    # Sorting — NULL deadlines go to the end regardless of sort direction
    allowed_sorts = {
        "deadline": FundingOpportunity.deadline,
        "title": FundingOpportunity.title,
        "organization": FundingOpportunity.organization,
        "funding_amount": FundingOpportunity.funding_amount,
        "created_at": FundingOpportunity.created_at,
    }
    sort_col = allowed_sorts.get(sort_by, FundingOpportunity.deadline)

    if sort_order.lower() == "asc":
        q = q.order_by(nulls_last(asc(sort_col)))
    else:
        q = q.order_by(nulls_last(desc(sort_col)))

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


# ---------------------------------------------------------------------------
# Single lookup
# ---------------------------------------------------------------------------

def get_funding_by_id(db: Session, funding_id: int) -> FundingOpportunity | None:
    return db.query(FundingOpportunity).filter(FundingOpportunity.id == funding_id).first()


# ---------------------------------------------------------------------------
# Save / Unsave / Saved list
# ---------------------------------------------------------------------------

def save_funding(
    db: Session, user_id: int, funding_id: int
) -> tuple[SavedFundingOpportunity, bool]:
    """Save a funding opportunity. Returns (record, created_new)."""
    opp = get_funding_by_id(db, funding_id)
    if opp is None:
        raise ValueError(f"Funding opportunity {funding_id} not found.")

    existing = (
        db.query(SavedFundingOpportunity)
        .filter(
            SavedFundingOpportunity.user_id == user_id,
            SavedFundingOpportunity.funding_id == funding_id,
        )
        .first()
    )
    if existing:
        return existing, False

    record = SavedFundingOpportunity(user_id=user_id, funding_id=funding_id)
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        existing = (
            db.query(SavedFundingOpportunity)
            .filter(
                SavedFundingOpportunity.user_id == user_id,
                SavedFundingOpportunity.funding_id == funding_id,
            )
            .first()
        )
        return existing, False
    return record, True


def unsave_funding(db: Session, user_id: int, funding_id: int) -> bool:
    """Remove saved funding. Returns True if removed."""
    record = (
        db.query(SavedFundingOpportunity)
        .filter(
            SavedFundingOpportunity.user_id == user_id,
            SavedFundingOpportunity.funding_id == funding_id,
        )
        .first()
    )
    if record is None:
        return False
    db.delete(record)
    db.commit()
    return True


def get_saved_funding(
    db: Session, user_id: int, page: int = 1, page_size: int = 20
) -> tuple[list[FundingOpportunity], int]:
    """Return paginated saved funding for a user."""
    q = (
        db.query(SavedFundingOpportunity)
        .filter(SavedFundingOpportunity.user_id == user_id)
        .order_by(SavedFundingOpportunity.created_at.desc())
    )
    total = q.count()
    saved = q.offset((page - 1) * page_size).limit(page_size).all()
    items = [s.funding for s in saved if s.funding]
    return items, total


def is_funding_saved(db: Session, user_id: int, funding_id: int) -> bool:
    return (
        db.query(SavedFundingOpportunity)
        .filter(
            SavedFundingOpportunity.user_id == user_id,
            SavedFundingOpportunity.funding_id == funding_id,
        )
        .first()
        is not None
    )


# ---------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------

def get_funding_by_ids(
    db: Session, funding_ids: list[int]
) -> list[FundingOpportunity]:
    """Retrieve multiple funding opportunities for comparison."""
    if not funding_ids:
        return []
    return (
        db.query(FundingOpportunity)
        .filter(FundingOpportunity.id.in_(funding_ids))
        .all()
    )


# ---------------------------------------------------------------------------
# Candidates for recommendations
# ---------------------------------------------------------------------------

def get_open_funding_candidates(
    db: Session,
    research_areas: list[str],
    keywords: list[str],
    limit: int = 100,
) -> list[FundingOpportunity]:
    """
    Return open funding opportunities that have any overlap with the
    given research_areas or keywords. Used by the recommendation engine.
    """
    filters = []
    for term in research_areas + keywords:
        if term and str(term).strip():
            t = f"%{str(term).strip()}%"
            filters.append(cast(FundingOpportunity.research_areas, String).ilike(t))
            filters.append(cast(FundingOpportunity.keywords, String).ilike(t))
            filters.append(FundingOpportunity.title.ilike(t))
            filters.append(FundingOpportunity.description.ilike(t))

    q = db.query(FundingOpportunity).filter(
        FundingOpportunity.status.ilike("open")
    )
    if filters:
        q = q.filter(or_(*filters))

    return q.limit(limit).all()
