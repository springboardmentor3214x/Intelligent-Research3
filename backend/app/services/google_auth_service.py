import secrets
from urllib.parse import urlencode
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.profile import ResearchProfile
from app.models.user import RoleEnum, User

settings = get_settings()


def get_google_auth_url() -> str:
    """Generate the Google OAuth2 authorization consent URL."""
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{base_url}?{urlencode(params)}"


async def verify_google_token(token_str: str) -> dict:
    """
    Verify Google ID Token or Access Token via Google's OAuth2 endpoints.
    """
    if not token_str or not token_str.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token is required",
        )

    token = token_str.strip()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Try Google TokenInfo endpoint (for ID tokens)
        try:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            )
            if resp.status_code == 200:
                data = resp.json()
                if "email" in data:
                    return data
        except Exception:
            pass

        # 2. Try Google UserInfo endpoint (for Bearer access tokens)
        try:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                if "email" in data:
                    return data
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid, unverified, or expired Google token",
    )


async def exchange_google_code(code: str) -> dict:
    """
    Exchange Google OAuth2 Authorization Code for userinfo.
    """
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(token_url, data=data)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange Google authorization code: {resp.text}",
            )
        tokens = resp.json()

        # Try userinfo with access_token
        if "access_token" in tokens:
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            if user_resp.status_code == 200:
                return user_resp.json()

        # Or verify id_token
        if "id_token" in tokens:
            return await verify_google_token(tokens["id_token"])

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unable to retrieve Google user profile details",
    )


def authenticate_or_register_google_user(db: Session, google_info: dict) -> User:
    """
    Find existing user by email or register a new user from Google profile data.
    """
    email = google_info.get("email", "").lower().strip()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must include a verified email address",
        )

    user = db.query(User).filter(User.email == email).first()

    if not user:
        name = (
            google_info.get("name")
            or google_info.get("given_name")
            or email.split("@")[0]
        ).strip()
        random_password = secrets.token_urlsafe(32)
        user = User(
            name=name,
            email=email,
            password_hash=get_password_hash(random_password),
            role=RoleEnum.RESEARCHER.value,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = db.query(ResearchProfile).filter_by(user_id=user.id).first()
        if not profile:
            profile = ResearchProfile(user_id=user.id)
            db.add(profile)
            db.commit()
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account has been deactivated",
        )

    return user