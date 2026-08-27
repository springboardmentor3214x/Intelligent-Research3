from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.research_profile import (
    OrganizationInfo,
    ResearchArea,
    ResearchKeyword,
    ResearchProfile,
    TechnologyArea,
)
from app.schemas.research_profile import (
    ResearchProfileCreate,
    ResearchProfileUpdate,
)


def get_profile_by_user_id(
    db: Session,
    user_id: int,
) -> ResearchProfile | None:
    return (
        db.query(ResearchProfile)
        .filter(ResearchProfile.user_id == user_id)
        .first()
    )


def create_profile(
    db: Session,
    user_id: int,
    payload: ResearchProfileCreate,
) -> ResearchProfile:

    existing_profile = get_profile_by_user_id(db, user_id)

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Research profile already exists",
        )

    profile = ResearchProfile(
        user_id=user_id,
        research_summary=payload.research_summary,
    )

    db.add(profile)
    db.flush()

    for area in payload.research_areas:
        db.add(
            ResearchArea(
                research_profile_id=profile.id,
                name=area.name,
            )
        )

    for keyword in payload.keywords:
        db.add(
            ResearchKeyword(
                research_profile_id=profile.id,
                keyword=keyword.keyword,
            )
        )

    for technology in payload.technology_areas:
        db.add(
            TechnologyArea(
                research_profile_id=profile.id,
                name=technology.name,
            )
        )

    if payload.organization_info:
        db.add(
            OrganizationInfo(
                research_profile_id=profile.id,
                organization_name=payload.organization_info.organization_name,
                department=payload.organization_info.department,
                designation=payload.organization_info.designation,
                country=payload.organization_info.country,
            )
        )

    db.commit()
    db.refresh(profile)

    return profile


def update_profile(
    db: Session,
    profile: ResearchProfile,
    payload: ResearchProfileUpdate,
) -> ResearchProfile:

    if payload.research_summary is not None:
        profile.research_summary = payload.research_summary

    if payload.research_areas is not None:
        profile.research_areas.clear()

        for area in payload.research_areas:
            profile.research_areas.append(
                ResearchArea(name=area.name)
            )

    if payload.keywords is not None:
        profile.keywords.clear()

        for keyword in payload.keywords:
            profile.keywords.append(
                ResearchKeyword(keyword=keyword.keyword)
            )

    if payload.technology_areas is not None:
        profile.technology_areas.clear()

        for technology in payload.technology_areas:
            profile.technology_areas.append(
                TechnologyArea(name=technology.name)
            )

    if payload.organization_info is not None:

        if profile.organization_info is None:
            profile.organization_info = OrganizationInfo()

        profile.organization_info.organization_name = (
            payload.organization_info.organization_name
        )

        profile.organization_info.department = (
            payload.organization_info.department
        )

        profile.organization_info.designation = (
            payload.organization_info.designation
        )

        profile.organization_info.country = (
            payload.organization_info.country
        )

    db.commit()
    db.refresh(profile)

    return profile