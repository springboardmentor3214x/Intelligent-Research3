"""
STUB ONLY. Replace `get_current_user` with however Module 1 actually
verifies tokens (e.g. decode a JWT, look up a session). Everything else
in this project just calls `Depends(get_current_user)` and doesn't care
how it's implemented internally — that's the point of using a dependency.
"""
from fastapi import Header, HTTPException, status


def get_current_user(authorization: str = Header(default=None)):
    """
    Expects: Authorization: Bearer <token>
    Returns a fake user_id derived from the token for local dev/testing.
    Replace the body with a real JWT decode / session lookup.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Empty token")

    # TODO: real implementation decodes the JWT and returns the actual user id.
    # For local testing, the token itself IS the user id (e.g. "user-123").
    return {"user_id": token}
