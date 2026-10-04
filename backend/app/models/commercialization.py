from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text

from app.db.base import Base


def _utcnow():
    return datetime.now(timezone.utc)


class CommercializationRecommendation(Base):
    """
    Module 8 - Commercialization Recommendation Engine Data Model.
    Stores evidence-based pathway evaluations:
    - Productization Recommendation
    - Licensing Opportunity
    - Startup Creation Recommendation
    - Industry Partnership Recommendation
    - Commercialization Readiness Score
    - Gaps, Risks, and Illustrative Roadmap
    """
    __tablename__ = "commercialization_recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    technology_id = Column(String(255), nullable=False, index=True)

    innovation_score = Column(Float, nullable=True)
    commercialization_readiness = Column(Float, nullable=True)
    data_completeness = Column(Float, nullable=True, default=100.0)
    lifecycle = Column(String(50), nullable=True)

    # Core Pathway Objects (scores, evidence, opportunities/licensees/partners, requirements, risks)
    productization = Column(JSON, nullable=True)
    licensing = Column(JSON, nullable=True)
    startup = Column(JSON, nullable=True)
    industry_partnership = Column(JSON, nullable=True)

    market_opportunities = Column(JSON, nullable=True)
    commercialization_gaps = Column(JSON, nullable=True)
    risks = Column(JSON, nullable=True)
    roadmap = Column(JSON, nullable=True)
    sources = Column(JSON, nullable=True)

    methodology_version = Column(String(50), nullable=False, default="commercialization_v1")
    explanation = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="complete")

    created_at = Column(
        DateTime,
        default=_utcnow,
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
