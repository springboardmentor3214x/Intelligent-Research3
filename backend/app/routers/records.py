from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.profile import Patent, Publication
from app.models.user import User
from app.schemas.profile import PatentCreate, PatentOut, PatentUpdate, PublicationCreate, PublicationOut, PublicationUpdate
from app.services.profile_service import get_or_create_profile, get_owned_record

publications = APIRouter(prefix="/publications", tags=["publications"])
patents = APIRouter(prefix="/patents", tags=["patents"])

@publications.get("", response_model=list[PublicationOut])
def list_publications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, current_user)
    db.commit()
    return db.query(Publication).filter_by(profile_id=profile.id).order_by(Publication.publication_date.desc().nullslast(), Publication.id.desc()).all()

@publications.post("", response_model=PublicationOut, status_code=status.HTTP_201_CREATED)
def create_publication(payload: PublicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, current_user)
    data = payload.model_dump()
    if data.get("publication_link") is not None:
        data["publication_link"] = str(data["publication_link"])
    record = Publication(profile_id=profile.id, **data)
    db.add(record); db.commit(); db.refresh(record); return record

@publications.get("/{record_id}", response_model=PublicationOut)
def get_publication(record_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_owned_record(db, Publication, record_id, get_or_create_profile(db, current_user).id)

@publications.put("/{record_id}", response_model=PublicationOut)
def update_publication(record_id: int, payload: PublicationUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = get_owned_record(db, Publication, record_id, get_or_create_profile(db, current_user).id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("publication_link") is not None:
        data["publication_link"] = str(data["publication_link"])
    for field, value in data.items(): setattr(record, field, value)
    db.commit(); db.refresh(record); return record

@publications.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publication(record_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = get_owned_record(db, Publication, record_id, get_or_create_profile(db, current_user).id)
    db.delete(record); db.commit()

@patents.get("", response_model=list[PatentOut])
def list_patents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, current_user); db.commit()
    return db.query(Patent).filter_by(profile_id=profile.id).order_by(Patent.filing_date.desc().nullslast(), Patent.id.desc()).all()

@patents.post("", response_model=PatentOut, status_code=status.HTTP_201_CREATED)
def create_patent(payload: PatentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, current_user)
    data = payload.model_dump()
    if data.get("patent_link") is not None:
        data["patent_link"] = str(data["patent_link"])
    record = Patent(profile_id=profile.id, **data)
    db.add(record); db.commit(); db.refresh(record); return record

@patents.get("/{record_id}", response_model=PatentOut)
def get_patent(record_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_owned_record(db, Patent, record_id, get_or_create_profile(db, current_user).id)

@patents.put("/{record_id}", response_model=PatentOut)
def update_patent(record_id: int, payload: PatentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = get_owned_record(db, Patent, record_id, get_or_create_profile(db, current_user).id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("patent_link") is not None:
        data["patent_link"] = str(data["patent_link"])
    for field, value in data.items(): setattr(record, field, value)
    db.commit(); db.refresh(record); return record

@patents.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patent(record_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = get_owned_record(db, Patent, record_id, get_or_create_profile(db, current_user).id)
    db.delete(record); db.commit()
