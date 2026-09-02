from datetime import datetime
from typing import Optional, Generic, TypeVar, Any

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from models import UserRole


T = TypeVar("T")


# ============================================================
# USER REGISTRATION
# ============================================================

class UserRegister(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Full name of the user"
    )

    email: EmailStr = Field(
        ...,
        description="Valid email address"
    )

    password: str = Field(
        ...,
        min_length=6,
        max_length=100,
        description="Password (at least 6 characters)"
    )

    role: Optional[UserRole] = Field(
        default=UserRole.RESEARCHER,
        description="User role in the system"
    )


# ============================================================
# USER LOGIN
# ============================================================

class UserLogin(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User registered email"
    )

    password: str = Field(
        ...,
        min_length=1,
        description="User password"
    )


# ============================================================
# USER RESPONSE
# ============================================================

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


# ============================================================
# USER PROFILE UPDATE
# ============================================================

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100,
        description="Updated full name"
    )

    email: Optional[EmailStr] = Field(
        default=None,
        description="Updated email address"
    )

    role: Optional[UserRole] = Field(
        default=None,
        description="Updated user role"
    )


# ============================================================
# TOKEN DATA
# ============================================================

class TokenData(BaseModel):
    email: Optional[str] = None


# ============================================================
# JWT TOKEN RESPONSE
# ============================================================

class Token(BaseModel):
    model_config = ConfigDict(extra="allow")
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# GENERIC API RESPONSE
# ============================================================

class APIResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(extra="allow")
    success: bool
    message: str
    data: Optional[T] = None
    errors: Optional[Any] = None