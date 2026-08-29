from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole
from schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    UserUpdate,
    Token,
    APIResponse,
)
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    oauth2_scheme,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=APIResponse[Token],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user with bcrypt hashed password and returns a JWT access token."
)
def register(
    user_in: UserRegister,
    db: Session = Depends(get_db)
):
    email_clean = user_in.email.lower().strip()

    existing_user = (
        db.query(User)
        .filter(User.email == email_clean)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    hashed_pwd = hash_password(user_in.password)

    new_user = User(
        full_name=user_in.full_name.strip(),
        email=email_clean,
        hashed_password=hashed_pwd,
        role=user_in.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={
            "sub": str(new_user.id),
            "email": new_user.email,
            "role": new_user.role.value
        }
    )

    return APIResponse(
        success=True,
        message="User registered successfully.",
        data=Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(new_user)
        )
    )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=APIResponse[Token],
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticates user credentials and returns a JWT access token."
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    email_clean = credentials.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email_clean)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(
        credentials.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    )

    return APIResponse(
        success=True,
        message="Login successful.",
        data=Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
    )


# ============================================================
# OAUTH2 PASSWORD FLOW
# ============================================================

@router.post(
    "/token",
    summary="OAuth2 login",
    description="OAuth2-compatible password login endpoint used by Swagger Authorize."
)
def oauth2_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    email_clean = form_data.username.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email_clean)
        .first()
    )

    if not user or not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================
# GET AUTHENTICATED USER
# ============================================================

def get_authenticated_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    payload = decode_access_token(token)

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return user


# ============================================================
# RBAC - ADMIN ONLY
# ============================================================

def require_admin(
    current_user: User = Depends(get_authenticated_user)
) -> User:

    if current_user.role != UserRole.ADMINISTRATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required."
        )

    return current_user


# ============================================================
# GET CURRENT USER PROFILE
# ============================================================

@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get current user profile",
    description="Returns the profile of the currently authenticated user via Bearer JWT token."
)
def get_current_user(
    current_user: User = Depends(get_authenticated_user)
):
    return APIResponse(
        success=True,
        message="User profile fetched successfully.",
        data=UserResponse.model_validate(current_user)
    )


# ============================================================
# UPDATE CURRENT USER PROFILE
# ============================================================

@router.put(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Update current user profile",
    description="Updates the authenticated user's profile."
)
def update_current_user(
    user_in: UserUpdate,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):

    # Update full name
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name.strip()

    # Update email
    if user_in.email is not None:

        new_email = user_in.email.lower().strip()

        existing_user = (
            db.query(User)
            .filter(
                User.email == new_email,
                User.id != current_user.id
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        current_user.email = new_email

    # Role change - ADMIN ONLY
    if user_in.role is not None:

        if current_user.role != UserRole.ADMINISTRATOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can change user roles."
            )

        current_user.role = user_in.role

    db.commit()
    db.refresh(current_user)

    return APIResponse(
        success=True,
        message="User profile updated successfully.",
        data=UserResponse.model_validate(current_user)
    )


# ============================================================
# ADMIN-ONLY ENDPOINT
# ============================================================

@router.get(
    "/admin-check",
    response_model=APIResponse[UserResponse],
    summary="Administrator access check",
    description="Protected endpoint accessible only to administrators."
)
def admin_check(
    current_user: User = Depends(require_admin)
):
    return APIResponse(
        success=True,
        message="Administrator authorization successful.",
        data=UserResponse.model_validate(current_user)
    )
