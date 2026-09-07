from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import RoleEnum, User
from app.schemas.auth import (
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import authenticate_user, issue_token, register_user
from app.services.google_auth_service import (
    authenticate_or_register_google_user,
    exchange_google_code,
    get_google_auth_url,
    verify_google_token,
)

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# =========================
# REGISTER
# =========================

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    user = register_user(db, payload)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "message": "User registered successfully",
    }


# =========================
# LOGIN
# =========================

@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, payload)

    return TokenResponse(
        access_token=issue_token(user),
        role=user.role,
        user_id=user.id,
    )


# =========================
# GOOGLE AUTH
# =========================

@router.post("/google", response_model=TokenResponse)
async def google_auth(
    payload: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    """Authenticate with Google ID Token or Access Token."""

    token = (
        payload.credential
        or payload.id_token
        or payload.token
        or payload.access_token
    )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google credential or token is required",
        )

    google_info = await verify_google_token(token)
    user = authenticate_or_register_google_user(db, google_info)

    return TokenResponse(
        access_token=issue_token(user),
        role=user.role,
        user_id=user.id,
    )


@router.get("/google/url")
def google_auth_url():
    """Get the Google OAuth2 authorization URL."""

    return {
        "url": get_google_auth_url(),
        "client_id": settings.GOOGLE_CLIENT_ID,
    }


@router.get("/google/login")
def google_login_redirect():
    """Redirect user directly to Google OAuth2 consent page."""

    return RedirectResponse(url=get_google_auth_url())


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    db: Session = Depends(get_db),
):
    """Handle OAuth2 callback."""

    google_info = await exchange_google_code(code)
    user = authenticate_or_register_google_user(db, google_info)
    token = issue_token(user)

    redirect_target = (
        f"{settings.FRONTEND_URL}/login"
        f"?token={token}"
        f"&role={user.role}"
        f"&user_id={user.id}"
    )

    return RedirectResponse(url=redirect_target)


# =========================
# GET AUTHENTICATED USER
# =========================

def get_authenticated_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:

    payload = decode_access_token(token)

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    return user


# =========================
# GET MY PROFILE
# =========================

@router.get("/me")
def get_current_user(
    current_user: User = Depends(get_authenticated_user),
):
    return {
        "success": True,
        "message": "User profile fetched successfully.",
        "data": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "phone_number": current_user.phone_number,
            "organization": current_user.organization,
            "designation": current_user.designation,
            "country": current_user.country,
            "research_domain": current_user.research_domain,
        },
    }


# =========================
# ADMIN AUTHORIZATION
# =========================

def require_admin(
    current_user: User = Depends(get_authenticated_user),
) -> User:

    if current_user.role != RoleEnum.ADMINISTRATOR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )

    return current_user


@router.get("/admin-check")
def admin_check(
    current_user: User = Depends(require_admin),
):
    return {
        "success": True,
        "message": "Administrator authorization successful.",
        "data": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },
    }


# =========================
# LOGOUT
# =========================

@router.post("/logout")
def logout():
    return {
        "message": "Logout successful. Client should discard token."
    }
