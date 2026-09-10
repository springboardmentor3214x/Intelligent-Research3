from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app import crud
from app.schemas import (
    FundingOut,
    PaginatedFunding,
    FundingSearchRequest,
    SaveFundingRequest,
    SavedFundingOut,
)

router = APIRouter(prefix="/api/funding", tags=["funding"])


@router.get("", response_model=PaginatedFunding)
def list_funding(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    if page < 1 or page_size < 1 or page_size > 100:
        raise HTTPException(status_code=422, detail="Invalid page or page_size")

    items, total = crud.list_funding(db, page=page, page_size=page_size)
    return {
        "items": [crud.to_funding_dict(f) for f in items],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/saved", response_model=list[SavedFundingOut])
def get_saved_funding(db: Session = Depends(get_db), user=Depends(get_current_user)):
    saved = crud.list_saved_funding(db, user_id=user["user_id"])
    return [
        {
            "id": s.id,
            "funding": crud.to_funding_dict(s.funding),
            "saved_at": s.saved_at,
        }
        for s in saved
    ]


@router.get("/{funding_id}", response_model=FundingOut)
def get_funding_details(funding_id: str, db: Session = Depends(get_db)):
    funding = crud.get_funding_by_id(db, funding_id)
    if not funding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funding opportunity not found")
    return crud.to_funding_dict(funding)


@router.post("/search", response_model=PaginatedFunding)
def search_funding(params: FundingSearchRequest, db: Session = Depends(get_db)):
    items, total = crud.search_funding(db, params)
    return {
        "items": [crud.to_funding_dict(f) for f in items],
        "page": params.page,
        "page_size": params.page_size,
        "total": total,
    }


@router.post("/save", status_code=status.HTTP_201_CREATED)
def save_funding(
    body: SaveFundingRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    funding = crud.get_funding_by_id(db, body.funding_id)
    if not funding:
        raise HTTPException(status_code=404, detail="Funding opportunity not found")

    record = crud.save_funding(db, user_id=user["user_id"], funding_id=body.funding_id)
    return {"id": record.id, "funding_id": record.funding_id, "saved_at": record.saved_at}


@router.delete("/saved/{funding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_funding(
    funding_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    removed = crud.unsave_funding(db, user_id=user["user_id"], funding_id=funding_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Saved funding record not found")
    return None
