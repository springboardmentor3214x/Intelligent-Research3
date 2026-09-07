from datetime import timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import RoleEnum, User
from app.schemas.auth import LoginRequest, RegisterRequest

settings = get_settings()
VALID_ROLES = {role.value for role in RoleEnum}


def register_user(db: Session, payload: RegisterRequest) -> User:
    email = payload.email.lower().strip()
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role selected")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(name=payload.name.strip(), email=email, password_hash=get_password_hash(payload.password), role=payload.role, phone_number=payload.phone_number, organization=payload.organization, designation=payload.designation, country=payload.country, research_domain=payload.research_domain)
    db.add(user); db.commit(); db.refresh(user); return user


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


def issue_token(user: User) -> str:
    return create_access_token(user.id, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
