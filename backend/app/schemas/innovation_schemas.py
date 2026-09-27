"""
app/schemas/innovation_schemas.py
------------------------------------
Request body shapes for the two Member 3 endpoints. FastAPI uses these
to validate incoming JSON automatically - a request with the wrong type
(e.g. a string where a number is expected) gets rejected with a clear
422 error before your code even runs.
"""

from typing import List, Optional
from pydantic import BaseModel


class ResearchNoveltyRequest(BaseModel):
    technology_id: str
    new_text: str
    existing_texts: List[str] = []
    research_gap_evidence: Optional[float] = None
    emerging_topic_evidence: Optional[float] = None
    new_direction_evidence: Optional[float] = None


class PatentStrengthRequest(BaseModel):
    technology_id: str
    activity: Optional[float] = None
    growth: Optional[float] = None
    citations: Optional[float] = None
    family_breadth: Optional[float] = None
    coverage: Optional[float] = None
    competitor_activity: Optional[float] = None
