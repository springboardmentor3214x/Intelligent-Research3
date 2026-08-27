from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.research_profile import Patent, ResearchProfile
from app.schemas.research_profile import PatentCreate, PatentUpdate


def get_profile_by_user_id(
    db: Session,
    user_id: int,
) -> ResearchProfile | None:

    return (
        db.query(ResearchProfile)
        .filter(
            ResearchProfile.user_id == user_id
        )
        .first()
    )


def create_patent(
    db: Session,
    user_id: int,
    payload: PatentCreate,
) -> Patent:

    profile = get_profile_by_user_id(
        db,
        user_id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research profile not found",
        )

    patent = Patent(
        research_profile_id=profile.id,
        title=payload.title,
        patent_number=payload.patent_number,
        filing_date=payload.filing_date,
        status=payload.status,
        description=payload.description,
    )

    db.add(patent)
    db.commit()
    db.refresh(patent)

    return patent


def get_patents(
    db: Session,
    user_id: int,
) -> list[Patent]:

    profile = get_profile_by_user_id(
        db,
        user_id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research profile not found",
        )

    return (
        db.query(Patent)
        .filter(
            Patent.research_profile_id == profile.id
        )
        .all()
    )


def get_patent(
    db: Session,
    user_id: int,
    patent_id: int,
) -> Patent:

    profile = get_profile_by_user_id(
        db,
        user_id,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research profile not found",
        )

    patent = (
        db.query(Patent)
        .filter(
            Patent.id == patent_id,
            Patent.research_profile_id == profile.id,
        )
        .first()
    )

    if patent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patent not found",
        )

    return patent


def update_patent(
    db: Session,
    user_id: int,
    patent_id: int,
    payload: PatentUpdate,
) -> Patent:

    patent = get_patent(
        db,
        user_id,
        patent_id,
    )

    for field, value in payload.model_dump(
        exclude_unset=True
    ).items():
        setattr(patent, field, value)

    db.commit()
    db.refresh(patent)

    return patent


def delete_patent(
    db: Session,
    user_id: int,
    patent_id: int,
) -> None:

    patent = get_patent(
        db,
        user_id,
        patent_id,
    )

    db.delete(patent)
    db.commit()