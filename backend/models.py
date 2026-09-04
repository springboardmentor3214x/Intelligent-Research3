import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, DateTime, Text

from database import Base


class UserRole(str, enum.Enum):
    RESEARCHER = "Researcher"
    STARTUP_FOUNDER = "Startup Founder"
    INNOVATION_MANAGER = "Innovation Manager"
    ADMINISTRATOR = "Administrator"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.RESEARCHER, nullable=False)
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

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


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

    def __repr__(self):
        return f"<ResearchPaper(id={self.id}, title='{self.title}')>"
