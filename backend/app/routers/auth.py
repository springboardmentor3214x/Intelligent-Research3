from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.auth import GoogleAuthRequest, LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import authenticate_user, issue_token, register_user
from app.services.google_auth_service import (
    authenticate_or_register_google_user,
    exchange_google_code,
    get_google_auth_url,
    verify_google_token,
)

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, payload)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "message": "User registered successfully",
    }


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload)
    return TokenResponse(access_token=issue_token(user), role=user.role, user_id=user.id)


@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google ID Token or Access Token."""
    token = payload.credential or payload.id_token or payload.token or payload.access_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google credential or token is required",
        )
    google_info = await verify_google_token(token)
    user = authenticate_or_register_google_user(db, google_info)
    return TokenResponse(access_token=issue_token(user), role=user.role, user_id=user.id)


@router.get("/google/url")
def google_auth_url():
    """Get the Google OAuth2 authorization URL."""
    return {"url": get_google_auth_url(), "client_id": settings.GOOGLE_CLIENT_ID}


@router.get("/google/login")
def google_login_redirect():
    """Redirect user directly to Google OAuth2 consent page."""
    return RedirectResponse(url=get_google_auth_url())


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    db: Session = Depends(get_db),
):
    """Handle OAuth2 callback from Google and redirect back to frontend with token."""
    google_info = await exchange_google_code(code)
    user = authenticate_or_register_google_user(db, google_info)
    token = issue_token(user)
    redirect_target = f"{settings.FRONTEND_URL}/login?token={token}&role={user.role}&user_id={user.id}"
    return RedirectResponse(url=redirect_target)


@router.post("/logout")
def logout():
    return {"message": "Logout successful. Client should discard token."}
