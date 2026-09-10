"""
Service layer: all database query logic lives here, not in the route
handlers. This keeps routers thin and makes the logic testable without
spinning up HTTP requests.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional
from datetime import datetime

from app.models import FundingOpportunity, SavedFunding
from app.schemas import FundingSearchRequest


def _split(value: Optional[str]):
    return [v.strip() for v in value.split(",")] if value else []


def to_funding_dict(f: FundingOpportunity) -> dict:
    """Convert stored comma-separated strings back into lists for the API response."""
    return {
        "id": f.id,
        "title": f.title,
        "organization": f.organization,
        "description": f.description,
        "funding_amount": f.funding_amount,
        "currency": f.currency,
        "deadline": f.deadline,
        "eligibility": f.eligibility,
        "research_areas": _split(f.research_areas),
        "keywords": _split(f.keywords),
        "funding_type": f.funding_type,
        "country": f.country,
        "source": f.source,
        "source_url": f.source_url,
        "application_url": f.application_url,
        "status": f.status,
    }


def get_funding_by_id(db: Session, funding_id: str) -> Optional[FundingOpportunity]:
    return db.query(FundingOpportunity).filter(FundingOpportunity.id == funding_id).first()


def list_funding(db: Session, page: int = 1, page_size: int = 20):
    query = db.query(FundingOpportunity)
    total = query.count()
    items = (
        query.order_by(FundingOpportunity.deadline.asc().nullslast())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def search_funding(db: Session, params: FundingSearchRequest):
    query = db.query(FundingOpportunity)
    filters = []

    if params.query:
        like = f"%{params.query}%"
        filters.append(
            or_(
                FundingOpportunity.title.ilike(like),
                FundingOpportunity.description.ilike(like),
                FundingOpportunity.keywords.ilike(like),
                FundingOpportunity.research_areas.ilike(like),
            )
        )

    if params.research_area:
        filters.append(FundingOpportunity.research_areas.ilike(f"%{params.research_area}%"))

    if params.country:
        filters.append(FundingOpportunity.country == params.country)

    if params.funding_type:
        filters.append(FundingOpportunity.funding_type == params.funding_type)

    if params.organization:
        filters.append(FundingOpportunity.organization.ilike(f"%{params.organization}%"))

    if params.min_amount is not None:
        filters.append(FundingOpportunity.funding_amount >= params.min_amount)

    if params.max_amount is not None:
        filters.append(FundingOpportunity.funding_amount <= params.max_amount)

    if params.deadline_from:
        filters.append(FundingOpportunity.deadline >= params.deadline_from)

    if params.deadline_to:
        filters.append(FundingOpportunity.deadline <= params.deadline_to)

    if filters:
        query = query.filter(and_(*filters))

    total = query.count()

    sort_column = {
        "deadline": FundingOpportunity.deadline,
        "amount": FundingOpportunity.funding_amount,
        "created_at": FundingOpportunity.created_at,
    }.get(params.sort_by, FundingOpportunity.deadline)

    items = (
        query.order_by(sort_column.asc().nullslast())
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )
    return items, total


def save_funding(db: Session, user_id: str, funding_id: str) -> SavedFunding:
    existing = (
        db.query(SavedFunding)
        .filter(SavedFunding.user_id == user_id, SavedFunding.funding_id == funding_id)
        .first()
    )
    if existing:
        return existing  # idempotent — saving twice doesn't create duplicates

    record = SavedFunding(user_id=user_id, funding_id=funding_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_saved_funding(db: Session, user_id: str):
    return db.query(SavedFunding).filter(SavedFunding.user_id == user_id).all()


def unsave_funding(db: Session, user_id: str, funding_id: str) -> bool:
    record = (
        db.query(SavedFunding)
        .filter(SavedFunding.user_id == user_id, SavedFunding.funding_id == funding_id)
        .first()
    )
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
