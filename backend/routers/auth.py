from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import jwt

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, UserResponse, Token, APIResponse
from security import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=APIResponse[Token],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user with bcrypt hashed password and returns a JWT access token."
)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    # 2. Hash password securely
    hashed_pwd = hash_password(user_in.password)

    # 3. Create new user instance
    new_user = User(
        full_name=user_in.full_name.strip(),
        email=user_in.email.lower().strip(),
        hashed_password=hashed_pwd,
        role=user_in.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Generate access token
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role.value})
    user_resp = UserResponse.model_validate(new_user)

    return APIResponse(
        success=True,
        message="User registered successfully.",
        data=Token(access_token=access_token, token_type="bearer", user=user_resp)
    )

@router.post(
    "/login",
    response_model=APIResponse[Token],
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticates user credentials using email & bcrypt password check and returns a JWT access token."
)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    email_clean = credentials.email.lower().strip()
    
    # 1. Fetch user by email
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 2. Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 3. Generate access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    user_resp = UserResponse.model_validate(user)

    return APIResponse(
        success=True,
        message="Login successful.",
        data=Token(access_token=access_token, token_type="bearer", user=user_resp)
    )

@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get current user profile",
    description="Returns the profile of the currently authenticated user via Bearer token."
)
def get_current_user(authorization: str = Header(..., description="Bearer JWT Token"), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header format.")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials or token expired.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return APIResponse(
        success=True,
        message="User profile fetched successfully.",
        data=UserResponse.model_validate(user)
    )
