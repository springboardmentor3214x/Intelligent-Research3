from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.research_profile import (
    PatentCreate,
    PatentOut,
    PatentUpdate,
)
from app.services.patent_service import (
    create_patent,
    delete_patent,
    get_patent,
    get_patents,
    update_patent,
)


router = APIRouter(
    prefix="/patents",
    tags=["patents"],
)


@router.post(
    "",
    response_model=PatentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_my_patent(
    payload: PatentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_patent(
        db,
        current_user.id,
        payload,
    )


@router.get(
    "",
    response_model=list[PatentOut],
)
def list_my_patents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_patents(
        db,
        current_user.id,
    )


@router.get(
    "/{patent_id}",
    response_model=PatentOut,
)
def get_my_patent(
    patent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_patent(
        db,
        current_user.id,
        patent_id,
    )


@router.put(
    "/{patent_id}",
    response_model=PatentOut,
)
def update_my_patent(
    patent_id: int,
    payload: PatentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_patent(
        db,
        current_user.id,
        patent_id,
        payload,
    )


@router.delete(
    "/{patent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_my_patent(
    patent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    delete_patent(
        db,
        current_user.id,
        patent_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )