from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.research import EmergingTopic, InsightsResponse, OpenAlexPublicationSearchResponse, PaperAnalysisResponse, RecommendationsResponse, TrendResponse
from app.services.research_intelligence import analyze_paper, build_insights, calculate_trends, recommendations, search_openalex_publications

router = APIRouter(prefix="/api/research", tags=["research intelligence"])


def _filters(research_domain, research_area, keyword, start_year, end_year):
    if start_year and end_year and start_year > end_year:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_year must not exceed end_year")
    return {"research_domain": research_domain, "research_area": research_area, "keyword": keyword, "start_year": start_year, "end_year": end_year}


@router.post("/papers/{paper_id}/analyze", response_model=PaperAnalysisResponse)
def analyze(paper_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = analyze_paper(db, paper_id, current_user)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research paper not found")
    return result


@router.get("/trends", response_model=TrendResponse)
def trends(research_domain: str | None = None, research_area: str | None = None, keyword: str | None = None, start_year: int | None = Query(None, ge=1900, le=2200), end_year: int | None = Query(None, ge=1900, le=2200), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return calculate_trends(db, current_user, _filters(research_domain, research_area, keyword, start_year, end_year))


@router.get("/insights", response_model=InsightsResponse)
def insights(research_domain: str | None = None, research_area: str | None = None, keyword: str | None = None, start_year: int | None = Query(None, ge=1900, le=2200), end_year: int | None = Query(None, ge=1900, le=2200), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_insights(db, current_user, _filters(research_domain, research_area, keyword, start_year, end_year))


@router.get("/emerging-topics", response_model=list[EmergingTopic])
def emerging_topics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    filters = {"research_domain": None, "research_area": None, "keyword": None, "start_year": None, "end_year": None}
    return calculate_trends(db, current_user, filters)["topic_growth"]


@router.get("/recommendations", response_model=RecommendationsResponse)
def research_recommendations(limit: int = Query(10, ge=1, le=50), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"recommendations": recommendations(db, current_user, limit)}


@router.get("/publications/search", response_model=OpenAlexPublicationSearchResponse)
def search_publications(
    query: str = Query(..., min_length=2, max_length=200),
    from_date: date = Query(date(2019, 1, 1), alias="from_publication_date"),
    to_date: date = Query(date(2019, 12, 31), alias="to_publication_date"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, alias="per-page", ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    if from_date > to_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="from_publication_date must not exceed to_publication_date")
    try:
        return search_openalex_publications(query.strip(), from_date, to_date, page, per_page)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc