from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ResearchProfile(Base):
    __tablename__ = "research_profiles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    research_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    research_areas: Mapped[list["ResearchArea"]] = relationship(
        "ResearchArea",
        back_populates="research_profile",
        cascade="all, delete-orphan",
    )

    keywords: Mapped[list["ResearchKeyword"]] = relationship(
        "ResearchKeyword",
        back_populates="research_profile",
        cascade="all, delete-orphan",
    )

    technology_areas: Mapped[list["TechnologyArea"]] = relationship(
        "TechnologyArea",
        back_populates="research_profile",
        cascade="all, delete-orphan",
    )

    organization_info: Mapped["OrganizationInfo | None"] = relationship(
        "OrganizationInfo",
        back_populates="research_profile",
        uselist=False,
        cascade="all, delete-orphan",
    )

    publications: Mapped[list["Publication"]] = relationship(
        "Publication",
        back_populates="research_profile",
        cascade="all, delete-orphan",
    )

    patents: Mapped[list["Patent"]] = relationship(
        "Patent",
        back_populates="research_profile",
        cascade="all, delete-orphan",
    )


class ResearchArea(Base):
    __tablename__ = "research_areas"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    research_profile_id: Mapped[int] = mapped_column(
        ForeignKey("research_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    research_profile: Mapped["ResearchProfile"] = relationship(
        "ResearchProfile",
        back_populates="research_areas",
    )


class ResearchKeyword(Base):
    __tablename__ = "research_keywords"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    research_profile_id: Mapped[int] = mapped_column(
        ForeignKey("research_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    keyword: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    research_profile: Mapped["ResearchProfile"] = relationship(
        "ResearchProfile",
        back_populates="keywords",
    )


class TechnologyArea(Base):
    __tablename__ = "technology_areas"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    research_profile_id: Mapped[int] = mapped_column(
        ForeignKey("research_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    research_profile: Mapped["ResearchProfile"] = relationship(
        "ResearchProfile",
        back_populates="technology_areas",
    )


class OrganizationInfo(Base):
    __tablename__ = "organization_info"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    research_profile_id: Mapped[int] = mapped_column(
        ForeignKey("research_profiles.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    organization_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    department: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    designation: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    research_profile: Mapped["ResearchProfile"] = relationship(
        "ResearchProfile",
        back_populates="organization_info",
    )


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    research_profile_id: Mapped[int] = mapped_column(
        ForeignKey("research_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    journal_or_conference: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    publication_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    doi: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    abstract: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    research_profile: Mapped["ResearchProfile"] = relationship(
        "ResearchProfile",
        back_populates="publications",
    )


class Patent(Base):
    __tablename__ = "patents"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    research_profile_id: Mapped[int] = mapped_column(
        ForeignKey("research_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    patent_number: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    filing_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    research_profile: Mapped["ResearchProfile"] = relationship(
        "ResearchProfile",
        back_populates="patents",
    )