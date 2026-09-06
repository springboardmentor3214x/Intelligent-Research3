from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.research_profile import (
    ResearchProfileCreate,
    ResearchProfileOut,
    ResearchProfileUpdate,
)
from app.services.research_profile_service import (
    create_profile,
    get_profile_by_user_id,
    update_profile,
)

router = APIRouter(
    prefix="/profile",
    tags=["research profile"],
)


@router.get(
    "",
    response_model=ResearchProfileOut,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(db, current_user.id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research profile not found",
        )

    return profile


@router.post(
    "",
    response_model=ResearchProfileOut,
    status_code=status.HTTP_201_CREATED,
)
def create_my_profile(
    payload: ResearchProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_profile(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )


@router.put(
    "",
    response_model=ResearchProfileOut,
)
def update_my_profile(
    payload: ResearchProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(db, current_user.id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research profile not found",
        )

    return update_profile(
        db=db,
        profile=profile,
        payload=payload,
    )