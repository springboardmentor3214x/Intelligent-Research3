from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TagKind(str, Enum):
    RESEARCH_AREA = "research_area"
    RESEARCH_INTEREST = "research_interest"
    RESEARCH_KEYWORD = "research_keyword"
    TECHNOLOGY_AREA = "technology_area"


class ResearchProfile(Base):
    __tablename__ = "research_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="research_profile")
    tags = relationship("ResearchTag", back_populates="profile", cascade="all, delete-orphan")
    publications = relationship("Publication", back_populates="profile", cascade="all, delete-orphan")
    patents = relationship("Patent", back_populates="profile", cascade="all, delete-orphan")


class ResearchTag(Base):
    __tablename__ = "research_tags"
    __table_args__ = (UniqueConstraint("profile_id", "kind", "normalized_value", name="uq_profile_tag"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("research_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(255), nullable=False)

    profile = relationship("ResearchProfile", back_populates="tags")


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("research_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    publication_title: Mapped[str] = mapped_column(String(500), nullable=False)
    authors: Mapped[str] = mapped_column(Text, nullable=False)
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    journal_or_conference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    publication_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    research_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    keywords: Mapped[str | None] = mapped_column(Text, nullable=True)
    doi: Mapped[str | None] = mapped_column(String(500), nullable=True)
    publication_link: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    profile = relationship("ResearchProfile", back_populates="publications")


class Patent(Base):
    __tablename__ = "patents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("research_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    patent_title: Mapped[str] = mapped_column(String(500), nullable=False)
    patent_number: Mapped[str] = mapped_column(String(150), nullable=False)
    inventor: Mapped[str] = mapped_column(String(255), nullable=False)
    filing_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    patent_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    patent_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    patent_link: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    profile = relationship("ResearchProfile", back_populates="patents")
