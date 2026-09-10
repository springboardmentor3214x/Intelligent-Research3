"""
These define what goes IN to your API (requests) and what comes OUT
(responses). Pydantic validates automatically — if a request doesn't match
the schema, FastAPI rejects it before your code even runs.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FundingOut(BaseModel):
    id: str
    title: str
    organization: Optional[str] = None
    description: Optional[str] = None
    funding_amount: Optional[float] = None
    currency: Optional[str] = None
    deadline: Optional[datetime] = None
    eligibility: Optional[str] = None
    research_areas: List[str] = []
    keywords: List[str] = []
    funding_type: Optional[str] = None
    country: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    application_url: Optional[str] = None
    status: str

    class Config:
        from_attributes = True  # lets this build directly from the SQLAlchemy model


class PaginatedFunding(BaseModel):
    items: List[FundingOut]
    page: int
    page_size: int
    total: int


class FundingSearchRequest(BaseModel):
    query: Optional[str] = None
    research_area: Optional[str] = None
    country: Optional[str] = None
    funding_type: Optional[str] = None
    organization: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    deadline_from: Optional[datetime] = None
    deadline_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 20
    sort_by: Optional[str] = "deadline"  # "deadline" | "amount" | "created_at"


class SaveFundingRequest(BaseModel):
    funding_id: str


class SavedFundingOut(BaseModel):
    id: str
    funding: FundingOut
    saved_at: datetime

    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    message: str
    detail: Optional[str] = None
