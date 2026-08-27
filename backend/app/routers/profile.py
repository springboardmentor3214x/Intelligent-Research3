from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.profile import ResearchProfile
from app.models.user import User
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.services.profile_service import get_or_create_profile, profile_response, replace_tags

router = APIRouter(tags=["research profile"])

@router.get("/profile", response_model=ProfileOut)
@router.get("/users/me/profile", response_model=ProfileOut, include_in_schema=False)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return profile_response(get_or_create_profile(db, current_user), current_user)

@router.put("/profile", response_model=ProfileOut)
def update_profile(payload: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, current_user)
    data = payload.model_dump(exclude_unset=True)
    for field in ("name", "organization", "designation", "country", "research_domain"):
        if field in data: setattr(current_user, field, data[field])
    if "department" in data: profile.department = data["department"]
    for field in ("research_areas", "research_interests", "research_keywords", "technology_areas"):
        if field in data: replace_tags(db, profile, field, data[field])
    db.commit(); db.refresh(current_user); db.refresh(profile)
    return profile_response(get_or_create_profile(db, current_user), current_user)
