from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import authenticate_user, issue_token, register_user

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, payload)
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "message": "User registered successfully"}

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload)
    return TokenResponse(access_token=issue_token(user), role=user.role, user_id=user.id)

@router.post("/logout")
def logout():
    return {"message": "Logout successful. Client should discard token."}
