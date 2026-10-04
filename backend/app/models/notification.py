"""
Module 10 - Notification & Alert System Models
Stores in-app notifications, alert categories, priorities, links,
and user alert preferences.
"""
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class NotificationCategory(str, Enum):
    FUNDING = "FUNDING"
    PATENT = "PATENT"
    TECHNOLOGY = "TECHNOLOGY"
    RESEARCH_TREND = "RESEARCH_TREND"
    COMMERCIALIZATION = "COMMERCIALIZATION"
    PLATFORM = "PLATFORM"


class NotificationPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Notification(Base):
    """
    In-app alert and notification record.
    Links directly to related module entities (Funding, Patent, Technology, etc.)
    and enables proactive delivery based on user research profile interests.
    """
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default=NotificationPriority.MEDIUM.value, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Navigation link (e.g., /funding, /tech-intel/tech-1, /commercialization, /patent-intel)
    link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    related_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # Extra rich metadata (e.g. deadline, amount, organization, technology_stage, assignee)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=_utcnow,
        nullable=False,
        index=True,
    )

    user = relationship("User", foreign_keys=[user_id])


class NotificationPreference(Base):
    """
    Per-user notification settings and category preferences.
    Controls what kinds of alerts the user wants to receive and minimum priority.
    """
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    funding_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    patent_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    technology_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    research_trend_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    commercialization_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    platform_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    email_notifications: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    in_app_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    min_priority: Mapped[str] = mapped_column(String(20), default=NotificationPriority.LOW.value, nullable=False)

    # User-defined custom topic keywords for extra matching
    custom_keywords: Mapped[list | None] = mapped_column(JSON, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )

    user = relationship("User", foreign_keys=[user_id])
