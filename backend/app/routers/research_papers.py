from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.research_paper import (
    ResearchPaperCreate,
    ResearchPaperResponse,
)
from app.services.research_paper_service import (
    create_paper,
    get_paper,
    search_papers,
)

router = APIRouter(
    prefix="/api/research-papers",
    tags=["Research Papers"],
)


@router.get("")
def search_research_papers(
    keyword: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    author: Optional[str] = Query(None),
    research_area: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("publication_year"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        papers, total = search_papers(
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
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    items = [
        ResearchPaperResponse.model_validate(paper)
        for paper in papers
    ]

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    return {
        "success": True,
        "message": "Research papers fetched successfully.",
        "data": {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
            },
        },
    }


@router.get("/{paper_id}")
def get_research_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = get_paper(db, paper_id)

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Research paper not found.",
        )

    return {
        "success": True,
        "message": "Research paper fetched successfully.",
        "data": ResearchPaperResponse.model_validate(paper),
    }


@router.post("")
def create_research_paper(
    paper: ResearchPaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_paper = create_paper(
        db=db,
        paper_data=paper.model_dump(),
    )

    return {
        "success": True,
        "message": "Research paper created successfully.",
        "data": ResearchPaperResponse.model_validate(new_paper),
    }