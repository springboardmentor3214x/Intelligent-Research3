import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean
from database import Base


class UserRole(str, enum.Enum):
    RESEARCHER = "Researcher"
    STARTUP_FOUNDER = "Startup Founder"
    INNOVATION_MANAGER = "Innovation Manager"
    ADMINISTRATOR = "Administrator"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    name = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, index=True, nullable=False)

    password_hash = Column(String(255), nullable=False)

    role = Column(
        Enum(UserRole),
        default=UserRole.RESEARCHER,
        nullable=False
    )

    phone_number = Column(String(20), nullable=True)

    organization = Column(String(255), nullable=True)

    designation = Column(String(255), nullable=True)

    country = Column(String(100), nullable=True)

    research_domain = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

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
        return (
            f"<User(id={self.id}, "
            f"email='{self.email}', "
            f"role='{self.role}')>"
        )