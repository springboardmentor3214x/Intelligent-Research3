from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=50)
    organization: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=150)
    country: str | None = Field(default=None, max_length=120)
    research_domain: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="Researcher")


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    phone_number: str | None = Field(default=None, max_length=50)
    organization: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=150)
    country: str | None = Field(default=None, max_length=120)
    research_domain: str | None = Field(default=None, max_length=255)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    phone_number: str | None = None
    organization: str | None = None
    designation: str | None = None
    country: str | None = None
    research_domain: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
