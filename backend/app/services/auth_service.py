from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import RoleEnum, User
from app.schemas.auth import LoginRequest, RegisterRequest

settings = get_settings()


VALID_ROLES = {
    RoleEnum.RESEARCHER.value,
    RoleEnum.STARTUP_FOUNDER.value,
    RoleEnum.INNOVATION_MANAGER.value,
    RoleEnum.ADMINISTRATOR.value,
}


def register_user(db: Session, payload: RegisterRequest) -> User:
    normalized_email = payload.email.lower().strip()

    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role selected",
        )

    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        phone_number=payload.phone_number,
        organization=payload.organization,
        designation=payload.designation,
        country=payload.country,
        research_domain=payload.research_domain,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    normalized_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    return user


def issue_token(user: User) -> str:
    expire_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(subject=user.id, expires_delta=expire_delta)
