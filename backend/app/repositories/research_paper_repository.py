from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.research_paper import ResearchPaper


def search_research_papers(
    db: Session,
    keyword: Optional[str] = None,
    year: Optional[int] = None,
    author: Optional[str] = None,
    research_area: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "publication_year",
    sort_order: str = "desc",
):
    query = db.query(ResearchPaper)

    if keyword:
        value = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                ResearchPaper.title.ilike(value),
                ResearchPaper.abstract.ilike(value),
                ResearchPaper.keywords.ilike(value),
            )
        )

    if year:
        query = query.filter(ResearchPaper.publication_year == year)

    if author:
        query = query.filter(
            ResearchPaper.authors.ilike(f"%{author.strip()}%")
        )

    if research_area:
        query = query.filter(
            ResearchPaper.research_area.ilike(
                f"%{research_area.strip()}%"
            )
        )

    allowed_sort_fields = {
        "publication_year": ResearchPaper.publication_year,
        "title": ResearchPaper.title,
        "created_at": ResearchPaper.created_at,
    }

    sort_column = allowed_sort_fields.get(sort_by)
    if sort_column is None:
        raise ValueError("Invalid sort_by value.")

    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    elif sort_order.lower() == "desc":
        query = query.order_by(sort_column.desc())
    else:
        raise ValueError("sort_order must be 'asc' or 'desc'.")

    total = query.count()

    offset = (page - 1) * page_size
    papers = query.offset(offset).limit(page_size).all()

    return papers, total


def get_research_paper_by_id(
    db: Session,
    paper_id: int,
):
    return (
        db.query(ResearchPaper)
        .filter(ResearchPaper.id == paper_id)
        .first()
    )


def create_research_paper(
    db: Session,
    paper_data: dict,
):
    paper = ResearchPaper(**paper_data)
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper