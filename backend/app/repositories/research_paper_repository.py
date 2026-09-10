"""
Research paper repository — Module 3 (query / save layer).

All DB logic is isolated here.  HTTP routing is in the router layer.
"""
from typing import Optional

from sqlalchemy import cast, or_, String
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.research_paper import ResearchPaper, SavedResearchPaper


# ---------------------------------------------------------------------------
# Search / List
# ---------------------------------------------------------------------------

def search_research_papers(
    db: Session,
    keyword: Optional[str] = None,
    year: Optional[int] = None,
    author: Optional[str] = None,
    research_area: Optional[str] = None,
    source: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "publication_year",
    sort_order: str = "desc",
):
    query = db.query(ResearchPaper)

    if keyword and keyword.strip():
        value = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                ResearchPaper.title.ilike(value),
                ResearchPaper.abstract.ilike(value),
                cast(ResearchPaper.keywords, String).ilike(value),
                cast(ResearchPaper.research_area, String).ilike(value),
            )
        )

    if year:
        query = query.filter(ResearchPaper.publication_year == year)

    if author and author.strip():
        query = query.filter(
            cast(ResearchPaper.authors, String).ilike(f"%{author.strip()}%")
        )

    if research_area and research_area.strip():
        query = query.filter(
            cast(ResearchPaper.research_area, String).ilike(
                f"%{research_area.strip()}%"
            )
        )

    if source and source.strip():
        query = query.filter(
            ResearchPaper.source.ilike(f"%{source.strip()}%")
        )

    allowed_sort_fields = {
        "publication_year": ResearchPaper.publication_year,
        "year": ResearchPaper.publication_year,
        "date": ResearchPaper.publication_date,
        "title": ResearchPaper.title,
        "created_at": ResearchPaper.created_at,
        "citations": ResearchPaper.publication_year,
        "relevance": ResearchPaper.created_at,
    }

    normalized_sort = (sort_by or "publication_year").strip().lower()
    sort_column = allowed_sort_fields.get(normalized_sort, ResearchPaper.publication_year)

    if (sort_order or "desc").lower() == "asc":
        query = query.order_by(sort_column.asc().nulls_last())
    else:
        query = query.order_by(sort_column.desc().nulls_last())

    total = query.count()

    offset = (page - 1) * page_size
    papers = query.offset(offset).limit(page_size).all()

    return papers, total


# ---------------------------------------------------------------------------
# Single paper lookup
# ---------------------------------------------------------------------------

def get_research_paper_by_id(
    db: Session,
    paper_id: int,
) -> ResearchPaper | None:
    return (
        db.query(ResearchPaper)
        .filter(ResearchPaper.id == paper_id)
        .first()
    )


# ---------------------------------------------------------------------------
# Create (manual insert — used by admin/test endpoints)
# ---------------------------------------------------------------------------

def create_research_paper(
    db: Session,
    paper_data: dict,
) -> ResearchPaper:
    paper = ResearchPaper(**paper_data)
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


# ---------------------------------------------------------------------------
# Save / Unsave / Saved list
# ---------------------------------------------------------------------------

def save_paper(
    db: Session,
    user_id: int,
    paper_id: int,
) -> tuple:
    """
    Save a paper for a user.

    Returns:
        (record, created) where created=True if newly saved, False if already saved.
    Raises ValueError if the paper does not exist.
    """
    paper = get_research_paper_by_id(db, paper_id)
    if paper is None:
        raise ValueError(f"Research paper {paper_id} not found.")

    existing = (
        db.query(SavedResearchPaper)
        .filter(
            SavedResearchPaper.user_id == user_id,
            SavedResearchPaper.paper_id == paper_id,
        )
        .first()
    )
    if existing:
        return existing, False

    record = SavedResearchPaper(user_id=user_id, paper_id=paper_id)
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        existing = (
            db.query(SavedResearchPaper)
            .filter(
                SavedResearchPaper.user_id == user_id,
                SavedResearchPaper.paper_id == paper_id,
            )
            .first()
        )
        return existing, False

    return record, True


def unsave_paper(
    db: Session,
    user_id: int,
    paper_id: int,
) -> bool:
    """
    Remove a saved paper for a user.
    Returns True if deleted, False if it was not saved.
    """
    record = (
        db.query(SavedResearchPaper)
        .filter(
            SavedResearchPaper.user_id == user_id,
            SavedResearchPaper.paper_id == paper_id,
        )
        .first()
    )
    if record is None:
        return False
    db.delete(record)
    db.commit()
    return True


def get_saved_papers(
    db: Session,
    user_id: int,
    page: int = 1,
    page_size: int = 20,
) -> tuple:
    """
    Return paginated saved papers for a user.
    Only returns papers belonging to the authenticated user.
    """
    q = (
        db.query(SavedResearchPaper)
        .filter(SavedResearchPaper.user_id == user_id)
        .order_by(SavedResearchPaper.created_at.desc())
    )
    total = q.count()
    saved = q.offset((page - 1) * page_size).limit(page_size).all()
    papers = [s.paper for s in saved if s.paper]
    return papers, total


def is_paper_saved(db: Session, user_id: int, paper_id: int) -> bool:
    return (
        db.query(SavedResearchPaper)
        .filter(
            SavedResearchPaper.user_id == user_id,
            SavedResearchPaper.paper_id == paper_id,
        )
        .first()
        is not None
    )