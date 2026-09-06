from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models import ResearchPaper, User
from schemas import (
    APIResponse,
    ResearchPaperCreate,
    ResearchPaperResponse
)
from routers.auth import get_authenticated_user


router = APIRouter(
    prefix="/api/research-papers",
    tags=["Research Papers"]
)


# ============================================================
# SEARCH + FILTER + PAGINATION + SORTING
# ============================================================

@router.get(
    "",
    response_model=APIResponse[dict],
    summary="Search research papers",
    description="Search research papers using keyword, year, author and research area filters."
)
def search_research_papers(
    keyword: Optional[str] = Query(default=None),
    year: Optional[int] = Query(default=None, ge=1900),
    author: Optional[str] = Query(default=None),
    research_area: Optional[str] = Query(default=None),

    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),

    sort_by: str = Query(
        default="publication_year",
        pattern="^(publication_year|title|created_at)$"
    ),
    sort_order: str = Query(
        default="desc",
        pattern="^(asc|desc)$"
    ),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
):
    query = db.query(ResearchPaper)

    # Keyword search
    if keyword:
        keyword_value = f"%{keyword.strip()}%"

        query = query.filter(
            (ResearchPaper.title.ilike(keyword_value)) |
            (ResearchPaper.abstract.ilike(keyword_value)) |
            (ResearchPaper.keywords.ilike(keyword_value))
        )

    # Year filter
    if year:
        query = query.filter(
            ResearchPaper.publication_year == year
        )

    # Author filter
    if author:
        query = query.filter(
            ResearchPaper.authors.ilike(f"%{author.strip()}%")
        )

    # Research area filter
    if research_area:
        query = query.filter(
            ResearchPaper.research_area.ilike(
                f"%{research_area.strip()}%"
            )
        )

    # Total records
    total = query.count()

    # Sorting
    sort_column = getattr(
        ResearchPaper,
        sort_by
    )

    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Pagination
    offset = (page - 1) * page_size

    papers = (
        query
        .offset(offset)
        .limit(page_size)
        .all()
    )

    paper_data = [
        ResearchPaperResponse.model_validate(paper)
        for paper in papers
    ]

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    return APIResponse(
        success=True,
        message="Research papers fetched successfully.",
        data={
            "items": paper_data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    )

# ============================================================
# CREATE RESEARCH PAPER
# ============================================================

@router.post(
    "",
    response_model=APIResponse[ResearchPaperResponse],
    summary="Create research paper",
    description="Create a new research paper."
)
def create_research_paper(
    paper: ResearchPaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
):
    new_paper = ResearchPaper(
        title=paper.title,
        authors=paper.authors,
        abstract=paper.abstract,
        publication_year=paper.publication_year,
        research_area=paper.research_area,
        keywords=paper.keywords,
        journal=paper.journal,
        doi=paper.doi,
        pdf_url=paper.pdf_url
    )

    db.add(new_paper)
    db.commit()
    db.refresh(new_paper)

    return APIResponse(
        success=True,
        message="Research paper created successfully.",
        data=ResearchPaperResponse.model_validate(new_paper)
    )
# ============================================================
# GET PAPER DETAILS
# ============================================================

@router.get(
    "/{paper_id}",
    response_model=APIResponse[ResearchPaperResponse],
    summary="Get research paper details",
    description="Returns complete details of a research paper."
)
def get_research_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user)
):
    paper = (
        db.query(ResearchPaper)
        .filter(ResearchPaper.id == paper_id)
        .first()
    )

    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research paper not found."
        )

    return APIResponse(
        success=True,
        message="Research paper fetched successfully.",
        data=ResearchPaperResponse.model_validate(paper)
    )