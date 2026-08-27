from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.models.profile import Patent, Publication, ResearchProfile, ResearchTag, TagKind
from app.models.user import User

TAG_FIELDS = {"research_areas": TagKind.RESEARCH_AREA, "research_interests": TagKind.RESEARCH_INTEREST, "research_keywords": TagKind.RESEARCH_KEYWORD, "technology_areas": TagKind.TECHNOLOGY_AREA}


def get_or_create_profile(db: Session, user: User) -> ResearchProfile:
    profile = db.query(ResearchProfile).options(selectinload(ResearchProfile.tags), selectinload(ResearchProfile.publications), selectinload(ResearchProfile.patents)).filter_by(user_id=user.id).first()
    if profile is None:
        profile = ResearchProfile(user_id=user.id)
        db.add(profile); db.flush()
    return profile


def profile_response(profile: ResearchProfile, user: User) -> dict:
    values = {field: [] for field in TAG_FIELDS}
    for tag in profile.tags:
        field = next((name for name, kind in TAG_FIELDS.items() if kind.value == tag.kind), None)
        if field: values[field].append(tag.value)
    return {"id": profile.id, "user_id": user.id, "name": user.name, "email": user.email, "organization": user.organization, "department": profile.department, "designation": user.designation, "country": user.country, "research_domain": user.research_domain, **values, "publications": profile.publications, "patents": profile.patents}


def replace_tags(db: Session, profile: ResearchProfile, field: str, values: list[str]) -> None:
    kind = TAG_FIELDS[field]
    profile.tags[:] = [tag for tag in profile.tags if tag.kind != kind.value]
    profile.tags.extend(ResearchTag(kind=kind.value, value=value, normalized_value=value.casefold()) for value in values)


def get_owned_record(db: Session, model, record_id: int, profile_id: int):
    record = db.query(model).filter(model.id == record_id, model.profile_id == profile_id).first()
    if record is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record
