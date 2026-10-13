"""
Pydantic Schemas for Research Discovery & Innovation Copilot
"""
from datetime import datetime
from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, Field, ConfigDict


class CopilotSessionCreate(BaseModel):
    topic: str = Field(..., min_length=2, max_length=255, description="Initial research topic or curiosity")
    title: Optional[str] = Field(None, max_length=255)
    domain: Optional[str] = Field("Artificial Intelligence", max_length=150)
    user_level: Optional[str] = Field("Beginner", description="Beginner, Intermediate, or Advanced")
    skills: Optional[List[str]] = Field(default_factory=list)
    resources: Optional[Union[Dict[str, Any], str]] = Field(default=None)


class CopilotSessionUpdate(BaseModel):
    title: Optional[str] = None
    user_level: Optional[str] = None
    skills: Optional[List[str]] = None
    resources: Optional[Union[Dict[str, Any], str]] = None
    current_stage: Optional[int] = None
    selected_idea_id: Optional[str] = None


class CopilotMessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    stage: int
    structured_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CopilotIdeaOut(BaseModel):
    id: str
    session_id: str
    title: str
    problem_statement: str
    proposed_solution: str
    target_gap: Optional[str] = None
    relevance_score: float = 85.0
    feasibility_score: float = 80.0
    novelty_evidence: Optional[str] = None
    risks_limitations: Optional[str] = None
    recommended_timeframe: Optional[str] = "6 Months"
    is_selected: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CopilotProjectPlanOut(BaseModel):
    id: str
    session_id: str
    idea_id: Optional[str] = None
    title: str
    objectives: List[str] = Field(default_factory=list)
    methodology: str
    datasets: List[Dict[str, Any]] = Field(default_factory=list)
    evaluation_metrics: List[str] = Field(default_factory=list)
    milestones: List[Dict[str, Any]] = Field(default_factory=list)
    funding_alignment: Optional[List[Dict[str, Any]]] = None
    patent_considerations: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CopilotSessionOut(BaseModel):
    id: str
    user_id: str
    title: str
    topic: str
    domain: str
    user_level: str
    skills: List[str] = Field(default_factory=list)
    resources: Dict[str, Any] = Field(default_factory=dict)
    current_stage: int
    selected_idea_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    ideas: List[CopilotIdeaOut] = Field(default_factory=list)
    plans: List[CopilotProjectPlanOut] = Field(default_factory=list)
    message_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class CopilotChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    stage: Optional[int] = Field(None, ge=1, le=5)
    user_level: Optional[str] = None
    skills: Optional[List[str]] = None
    resources: Optional[Dict[str, Any]] = None


class CopilotChatResponse(BaseModel):
    session_id: str
    message: str
    stage: int
    structured_data: Optional[Dict[str, Any]] = None
    follow_up_suggestions: List[str] = Field(default_factory=list)


class CopilotSelectIdeaRequest(BaseModel):
    idea_id: str
    custom_constraints: Optional[str] = None
