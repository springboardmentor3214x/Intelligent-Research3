from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from app.db.base import Base


class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False, index=True)
    authors = Column(String(1000), nullable=False, index=True)
    abstract = Column(Text, nullable=True)
    publication_year = Column(Integer, nullable=True, index=True)
    research_area = Column(String(255), nullable=True, index=True)
    keywords = Column(String(1000), nullable=True, index=True)
    journal = Column(String(500), nullable=True)
    doi = Column(String(255), nullable=True, unique=True)
    pdf_url = Column(String(1000), nullable=True)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )