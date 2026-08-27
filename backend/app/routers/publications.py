from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.research_profile import (
    PublicationCreate,
    PublicationOut,
    PublicationUpdate,
)
from app.services.publication_service import (
    create_publication,
    delete_publication,
    get_publication,
    get_publications,
    update_publication,
)

router = APIRouter(
    prefix="/publications",
    tags=["publications"],
)


@router.post(
    "",
    response_model=PublicationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_my_publication(
    payload: PublicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_publication(
        db,
        current_user.id,
        payload,
    )


@router.get(
    "",
    response_model=list[PublicationOut],
)
def list_my_publications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_publications(
        db,
        current_user.id,
    )


@router.get(
    "/{publication_id}",
    response_model=PublicationOut,
)
def get_my_publication(
    publication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_publication(
        db,
        current_user.id,
        publication_id,
    )


@router.put(
    "/{publication_id}",
    response_model=PublicationOut,
)
def update_my_publication(
    publication_id: int,
    payload: PublicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_publication(
        db,
        current_user.id,
        publication_id,
        payload,
    )


@router.delete(
    "/{publication_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_my_publication(
    publication_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_publication(
        db,
        current_user.id,
        publication_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)