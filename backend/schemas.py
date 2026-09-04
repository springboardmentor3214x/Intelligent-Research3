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
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# GENERIC API RESPONSE
# ============================================================

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    errors: Optional[Any] = None
    # ============================================================
# RESEARCH PAPER SCHEMAS
# ============================================================

class ResearchPaperBase(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Title of the research paper"
    )

    authors: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Authors of the research paper"
    )

    abstract: Optional[str] = Field(
        default=None,
        description="Abstract of the research paper"
    )

    publication_year: Optional[int] = Field(
        default=None,
        ge=1900,
        description="Year in which the paper was published"
    )

    research_area: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Main research area"
    )

    keywords: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Keywords related to the paper"
    )

    journal: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Journal or publication venue"
    )

    doi: Optional[str] = Field(
        default=None,
        max_length=255,
        description="DOI of the research paper"
    )

    pdf_url: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="URL of the research paper PDF"
    )


class ResearchPaperCreate(ResearchPaperBase):
    pass


class ResearchPaperResponse(ResearchPaperBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime