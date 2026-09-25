"""
Module 6 – Technology Intelligence Database Models
Stores technologies, yearly metrics, trends, maturity scores,
opportunities, competitors, and data source logs.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Technology(Base):
    """Core technology record."""
    __tablename__ = "technologies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    technology_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[str | None] = mapped_column(String(150), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[list | None] = mapped_column(JSON, nullable=True)
    related_technologies: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # Flag to distinguish demo/seed data from live-API data
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    metrics: Mapped[list["TechnologyMetric"]] = relationship(
        "TechnologyMetric", back_populates="technology", cascade="all, delete-orphan"
    )
    maturity: Mapped["TechnologyMaturity | None"] = relationship(
        "TechnologyMaturity", back_populates="technology", uselist=False, cascade="all, delete-orphan"
    )
    trend: Mapped["TechnologyTrend | None"] = relationship(
        "TechnologyTrend", back_populates="technology", uselist=False, cascade="all, delete-orphan"
    )
    opportunities: Mapped[list["TechnologyOpportunity"]] = relationship(
        "TechnologyOpportunity", back_populates="technology", cascade="all, delete-orphan"
    )
    competitors: Mapped[list["TechnologyCompetitor"]] = relationship(
        "TechnologyCompetitor", back_populates="technology", cascade="all, delete-orphan"
    )


class TechnologyMetric(Base):
    """Yearly research/patent/org/application metrics per technology."""
    __tablename__ = "technology_metrics"
    __table_args__ = (UniqueConstraint("technology_id", "year", name="uq_tech_metric_year"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    technology_id: Mapped[int] = mapped_column(
        ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    research_papers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    patents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    organizations: Mapped[int | None] = mapped_column(Integer, nullable=True)
    applications: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Adoption: stored separately, NOT part of the six maturity indicators
    adoption_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    citations: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # True = seed/demo data, False = live API data
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    technology: Mapped["Technology"] = relationship("Technology", back_populates="metrics")


class TechnologyTrend(Base):
    """
    Calculated multi-year trend indicators.
    Requires >= 3 years of data for meaningful analysis.
    """
    __tablename__ = "technology_trends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    technology_id: Mapped[int] = mapped_column(
        ForeignKey("technologies.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    # Average year-over-year growth rates
    research_growth: Mapped[float | None] = mapped_column(Float, nullable=True)
    patent_growth: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Direction: "Increasing" | "Stable" | "Decreasing" | "Insufficient Data"
    research_direction: Mapped[str | None] = mapped_column(String(30), nullable=True)
    patent_direction: Mapped[str | None] = mapped_column(String(30), nullable=True)
    organization_direction: Mapped[str | None] = mapped_column(String(30), nullable=True)
    application_direction: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # Linear regression slopes (positive = increasing)
    research_slope: Mapped[float | None] = mapped_column(Float, nullable=True)
    patent_slope: Mapped[float | None] = mapped_column(Float, nullable=True)
    # 0.0–1.0 confidence based on data availability and consistency
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    years_analysed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Full yearly growth breakdown stored as JSON
    yearly_research_growth: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    yearly_patent_growth: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    technology: Mapped["Technology"] = relationship("Technology", back_populates="trend")


class TechnologyMaturity(Base):
    """
    Maturity analysis result.
    Methodology: maturity_v1
    Weights: Research Growth 25%, Patent Growth 25%,
             Research Activity 15%, Patent Activity 15%,
             Organization Participation 10%, Diversity 10%
    Adoption is stored separately and NOT in the 6 weighted indicators.
    """
    __tablename__ = "technology_maturity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    technology_id: Mapped[int] = mapped_column(
        ForeignKey("technologies.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    # Stage: "Emerging" | "Developing" | "Mature" | "Declining"
    stage: Mapped[str] = mapped_column(String(30), nullable=False)
    # Composite score 0-100
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Individual indicator scores 0-100
    research_growth_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    patent_growth_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    research_activity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    patent_activity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    organization_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    diversity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Adoption stored separately
    adoption_level: Mapped[str | None] = mapped_column(String(30), nullable=True)
    adoption_trend: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # 0.0–1.0 data confidence
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Structured explanation with summary, evidence list, limitations
    explanation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Version allows future methodology changes without rewriting app
    methodology_version: Mapped[str] = mapped_column(String(50), default="maturity_v1", nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    technology: Mapped["Technology"] = relationship("Technology", back_populates="maturity")


class TechnologyOpportunity(Base):
    """Detected innovation opportunity signals for a technology."""
    __tablename__ = "technology_opportunities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    technology_id: Mapped[int] = mapped_column(
        ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    opportunity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    signals: Mapped[list | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    technology: Mapped["Technology"] = relationship("Technology", back_populates="opportunities")


class TechnologyCompetitor(Base):
    """Organization-level competitive activity per technology."""
    __tablename__ = "technology_competitors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    technology_id: Mapped[int] = mapped_column(
        ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    research_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    patent_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    research_trend: Mapped[str | None] = mapped_column(String(30), nullable=True)
    patent_trend: Mapped[str | None] = mapped_column(String(30), nullable=True)
    applications: Mapped[list | None] = mapped_column(JSON, nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)

    technology: Mapped["Technology"] = relationship("Technology", back_populates="competitors")


class DataSourceLog(Base):
    """Tracks every external API query for provenance and caching."""
    __tablename__ = "data_source_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    endpoint: Mapped[str | None] = mapped_column(Text, nullable=True)
    query: Mapped[str | None] = mapped_column(Text, nullable=True)
    # "success" | "error" | "partial" | "cached"
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    records_fetched: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    methodology_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
