from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.research_profile import Publication, ResearchProfile
from app.schemas.research_profile import (
    PublicationCreate,
    PublicationUpdate,
)


def get_user_profile(
    db: Session,
    user_id: int,
) -> ResearchProfile:

    profile = (
        db.query(ResearchProfile)
        .filter(
            ResearchProfile.user_id == user_id
        )
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research profile not found",
        )

    return profile


def create_publication(
    db: Session,
    user_id: int,
    payload: PublicationCreate,
) -> Publication:

    profile = get_user_profile(
        db,
        user_id,
    )

    publication = Publication(
        research_profile_id=profile.id,
        title=payload.title,
        journal_or_conference=payload.journal_or_conference,
        publication_year=payload.publication_year,
        doi=payload.doi,
        abstract=payload.abstract,
    )

    db.add(publication)
    db.commit()
    db.refresh(publication)

    return publication


def get_publications(
    db: Session,
    user_id: int,
) -> list[Publication]:

    profile = get_user_profile(
        db,
        user_id,
    )

    return (
        db.query(Publication)
        .filter(
            Publication.research_profile_id == profile.id
        )
        .all()
    )


def get_publication(
    db: Session,
    user_id: int,
    publication_id: int,
) -> Publication:

    profile = get_user_profile(
        db,
        user_id,
    )

    publication = (
        db.query(Publication)
        .filter(
            Publication.id == publication_id,
            Publication.research_profile_id == profile.id,
        )
        .first()
    )

    if publication is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publication not found",
        )

    return publication


def update_publication(
    db: Session,
    user_id: int,
    publication_id: int,
    payload: PublicationUpdate,
) -> Publication:

    publication = get_publication(
        db,
        user_id,
        publication_id,
    )

    for field, value in payload.model_dump(
        exclude_unset=True
    ).items():
        setattr(publication, field, value)

    db.commit()
    db.refresh(publication)

    return publication


def delete_publication(
    db: Session,
    user_id: int,
    publication_id: int,
) -> None:

    publication = get_publication(
        db,
        user_id,
        publication_id,
    )

    db.delete(publication)
    db.commit()