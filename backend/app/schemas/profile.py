from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


def clean_text(value: str | None) -> str | None:
    if value is None: return None
    value = value.strip()
    return value or None


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    organization: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=150)
    designation: str | None = Field(default=None, max_length=150)
    country: str | None = Field(default=None, max_length=120)
    research_domain: str | None = Field(default=None, max_length=255)
    research_areas: list[str] | None = None
    research_interests: list[str] | None = None
    research_keywords: list[str] | None = None
    technology_areas: list[str] | None = None

    @field_validator("name", "organization", "department", "designation", "country", "research_domain", mode="before")
    @classmethod
    def strip_text(cls, value):
        return clean_text(value)

    @field_validator("research_areas", "research_interests", "research_keywords", "technology_areas")
    @classmethod
    def validate_tags(cls, values):
        if values is None: return values
        cleaned = [item.strip() for item in values if item and item.strip()]
        if len({item.casefold() for item in cleaned}) != len(cleaned):
            raise ValueError("Duplicate research tags are not allowed")
        if any(len(item) > 255 for item in cleaned):
            raise ValueError("Research tags must be 255 characters or fewer")
        return cleaned


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    value: str


class PublicationBase(BaseModel):
    publication_title: str = Field(..., min_length=1, max_length=500)
    authors: str = Field(..., min_length=1, max_length=5000)
    publication_date: date | None = None
    journal_or_conference: str | None = Field(default=None, max_length=255)
    publication_type: str | None = Field(default=None, max_length=100)
    research_domain: str | None = Field(default=None, max_length=255)
    keywords: str | None = Field(default=None, max_length=5000)
    doi: str | None = Field(default=None, max_length=500)
    publication_link: HttpUrl | None = None

    @field_validator("publication_title", "authors", "journal_or_conference", "publication_type", "research_domain", "keywords", "doi", mode="before")
    @classmethod
    def strip_fields(cls, value):
        return value.strip() if isinstance(value, str) else value


class PublicationCreate(PublicationBase): pass
class PublicationUpdate(BaseModel):
    publication_title: str | None = Field(default=None, min_length=1, max_length=500)
    authors: str | None = Field(default=None, min_length=1, max_length=5000)
    publication_date: date | None = None
    journal_or_conference: str | None = Field(default=None, max_length=255)
    publication_type: str | None = Field(default=None, max_length=100)
    research_domain: str | None = Field(default=None, max_length=255)
    keywords: str | None = Field(default=None, max_length=5000)
    doi: str | None = Field(default=None, max_length=500)
    publication_link: HttpUrl | None = None


class PublicationOut(PublicationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    profile_id: int
    created_at: datetime
    updated_at: datetime


class PatentBase(BaseModel):
    patent_title: str = Field(..., min_length=1, max_length=500)
    patent_number: str = Field(..., min_length=1, max_length=150)
    inventor: str = Field(..., min_length=1, max_length=255)
    filing_date: date | None = None
    publication_date: date | None = None
    patent_status: str | None = Field(default=None, max_length=100)
    patent_domain: str | None = Field(default=None, max_length=255)
    patent_link: HttpUrl | None = None

    @field_validator("patent_title", "patent_number", "inventor", "patent_status", "patent_domain", mode="before")
    @classmethod
    def strip_fields(cls, value):
        return value.strip() if isinstance(value, str) else value


class PatentCreate(PatentBase): pass
class PatentUpdate(BaseModel):
    patent_title: str | None = Field(default=None, min_length=1, max_length=500)
    patent_number: str | None = Field(default=None, min_length=1, max_length=150)
    inventor: str | None = Field(default=None, min_length=1, max_length=255)
    filing_date: date | None = None
    publication_date: date | None = None
    patent_status: str | None = Field(default=None, max_length=100)
    patent_domain: str | None = Field(default=None, max_length=255)
    patent_link: HttpUrl | None = None


class PatentOut(PatentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    profile_id: int
    created_at: datetime
    updated_at: datetime


class ProfileOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    role: str | None = None
    organization: str | None = None
    department: str | None = None
    designation: str | None = None
    country: str | None = None
    research_domain: str | None = None
    research_areas: list[str] = []
    research_interests: list[str] = []
    research_keywords: list[str] = []
    technology_areas: list[str] = []
    publications: list[PublicationOut] = []
    patents: list[PatentOut] = []
