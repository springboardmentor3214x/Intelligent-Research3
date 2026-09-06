from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security), db: Session = Depends(get_db)) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authentication credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("Missing subject")
        user = db.query(User).filter(User.id == int(user_id)).first()
    except (JWTError, ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token", headers={"WWW-Authenticate": "Bearer"}) from exc
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_roles(*allowed_roles: str):
    """Dependency factory to enforce Role-Based Access Control (RBAC)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").strip().lower()
        normalized_allowed = [r.strip().lower() for r in allowed_roles]
        if user_role not in normalized_allowed and user_role != "administrator" and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Role '{current_user.role}' does not have required permissions."
            )
        return current_user
    return role_checker


# Role shortcut dependencies
require_admin = require_roles("Administrator", "admin")
require_researcher = require_roles("Researcher", "Administrator", "admin")
require_startup_founder = require_roles("Startup Founder", "Administrator", "admin")
require_innovation_manager = require_roles("Innovation Manager", "Administrator", "admin")

