from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResearchAreaBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ResearchAreaCreate(ResearchAreaBase):
    pass


class ResearchAreaOut(ResearchAreaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ResearchKeywordBase(BaseModel):
    keyword: str = Field(min_length=1, max_length=150)


class ResearchKeywordCreate(ResearchKeywordBase):
    pass


class ResearchKeywordOut(ResearchKeywordBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class TechnologyAreaBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class TechnologyAreaCreate(TechnologyAreaBase):
    pass


class TechnologyAreaOut(TechnologyAreaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OrganizationInfoBase(BaseModel):
    organization_name: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    designation: str | None = Field(default=None, max_length=150)
    country: str | None = Field(default=None, max_length=120)


class OrganizationInfoCreate(OrganizationInfoBase):
    pass


class OrganizationInfoOut(OrganizationInfoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PublicationBase(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    journal_or_conference: str | None = Field(default=None, max_length=255)
    publication_year: int | None = Field(default=None, ge=1900, le=2100)
    doi: str | None = Field(default=None, max_length=255)
    abstract: str | None = None


class PublicationCreate(PublicationBase):
    pass


class PublicationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    journal_or_conference: str | None = Field(default=None, max_length=255)
    publication_year: int | None = Field(default=None, ge=1900, le=2100)
    doi: str | None = Field(default=None, max_length=255)
    abstract: str | None = None


class PublicationOut(PublicationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PatentBase(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    patent_number: str | None = Field(default=None, max_length=150)
    filing_date: datetime | None = None
    status: str | None = Field(default=None, max_length=100)
    description: str | None = None


class PatentCreate(PatentBase):
    pass


class PatentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    patent_number: str | None = Field(default=None, max_length=150)
    filing_date: datetime | None = None
    status: str | None = Field(default=None, max_length=100)
    description: str | None = None


class PatentOut(PatentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ResearchProfileCreate(BaseModel):
    research_summary: str | None = None
    research_areas: list[ResearchAreaCreate] = []
    keywords: list[ResearchKeywordCreate] = []
    technology_areas: list[TechnologyAreaCreate] = []
    organization_info: OrganizationInfoCreate | None = None


class ResearchProfileUpdate(BaseModel):
    research_summary: str | None = None
    research_areas: list[ResearchAreaCreate] | None = None
    keywords: list[ResearchKeywordCreate] | None = None
    technology_areas: list[TechnologyAreaCreate] | None = None
    organization_info: OrganizationInfoCreate | None = None


class ResearchProfileOut(BaseModel):
    id: int
    user_id: int
    research_summary: str | None

    research_areas: list[ResearchAreaOut]
    keywords: list[ResearchKeywordOut]
    technology_areas: list[TechnologyAreaOut]
    organization_info: OrganizationInfoOut | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)