"""
Database Models for Research Discovery & Innovation Copilot
Tracks continuous conversational sessions, progressive learning stages,
verified literature citations, evidence-based research gaps, candidate ideas, and project plans.
"""
from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class CopilotSession(Base):
    __tablename__ = "copilot_sessions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(128), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    domain = Column(String(150), default="Artificial Intelligence")
    user_level = Column(String(50), default="Beginner")  # Beginner, Intermediate, Advanced
    skills = Column(JSON, default=list)  # ["Python", "PyTorch", "Basic Stats"]
    resources = Column(JSON, default=dict)  # {"compute": "1 GPU", "time_months": 6, "lab": "University Lab"}
    current_stage = Column(Integer, default=1)  # 1: Concept, 2: Literature, 3: Gaps, 4: Ideas, 5: Blueprint
    selected_idea_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    messages = relationship("CopilotMessage", back_populates="session", cascade="all, delete-orphan", order_by="CopilotMessage.created_at")
    ideas = relationship("CopilotIdea", back_populates="session", cascade="all, delete-orphan")
    plans = relationship("CopilotProjectPlan", back_populates="session", cascade="all, delete-orphan")


class CopilotMessage(Base):
    __tablename__ = "copilot_messages"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(64), ForeignKey("copilot_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    stage = Column(Integer, default=1)
    # Structured context: papers, gaps, suggestions, analogies, etc.
    structured_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("CopilotSession", back_populates="messages")


class CopilotIdea(Base):
    __tablename__ = "copilot_ideas"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(64), ForeignKey("copilot_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=False)
    proposed_solution = Column(Text, nullable=False)
    target_gap = Column(Text, nullable=True)
    relevance_score = Column(Float, default=85.0)  # 0-100
    feasibility_score = Column(Float, default=80.0)  # 0-100
    novelty_evidence = Column(Text, nullable=True)
    risks_limitations = Column(Text, nullable=True)
    recommended_timeframe = Column(String(100), default="6 Months")
    is_selected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("CopilotSession", back_populates="ideas")


class CopilotProjectPlan(Base):
    __tablename__ = "copilot_project_plans"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(64), ForeignKey("copilot_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    idea_id = Column(String(64), nullable=True)
    title = Column(String(255), nullable=False)
    objectives = Column(JSON, default=list)  # list of clear milestones/goals
    methodology = Column(Text, nullable=False)
    datasets = Column(JSON, default=list)  # list of recommended benchmarks/datasets
    evaluation_metrics = Column(JSON, default=list)  # accuracy, latency, FID, etc.
    milestones = Column(JSON, default=list)  # {"phase": "Phase 1", "timeline": "Month 1-2", "deliverable": "..."}
    funding_alignment = Column(JSON, nullable=True)  # matching grant agencies (NSF, Horizon, etc.)
    patent_considerations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("CopilotSession", back_populates="plans")
