from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.db.base import Base


class InnovationScore(Base):
    __tablename__ = "innovation_scores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    technology_id = Column(String(255), nullable=False, index=True)

    research_novelty = Column(Float, nullable=True)
    patent_strength = Column(Float, nullable=True)
    technology_maturity = Column(Float, nullable=True)
    market_potential = Column(Float, nullable=True)
    funding_relevance = Column(Float, nullable=True)

    innovation_score = Column(Float, nullable=True)

    status = Column(String(50), nullable=False)

    methodology_version = Column(String(50), nullable=False, default="innovation_v1")

    missing_factors = Column(Text, nullable=True)

    explanation = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )