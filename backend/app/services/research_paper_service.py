from typing import Optional

from sqlalchemy.orm import Session

from app.models.research_paper import ResearchPaper
from app.repositories.research_paper_repository import (
    create_research_paper,
    get_research_paper_by_id,
    search_research_papers,
)


def search_papers(
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
    return search_research_papers(
        db=db,
        keyword=keyword,
        year=year,
        author=author,
        research_area=research_area,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


def get_paper(db: Session, paper_id: int):
    return get_research_paper_by_id(db, paper_id)


def create_paper(db: Session, paper_data: dict):
    return create_research_paper(db, paper_data)