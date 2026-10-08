"""
Module 10: Notification Data Models
Implements normalized, scalable models for Notifications, Events, Preferences, Deliveries, and Audit Logs.
"""
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, JSON, Text, ForeignKey, Index
from sqlalchemy.sql import func
from ..database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class NotificationEvent(Base):
    __tablename__ = "notification_events"

    event_id = Column(String(64), primary_key=True, default=generate_uuid)
    event_type = Column(String(64), nullable=False, index=True)
    source_module = Column(String(32), nullable=False, index=True)
    entity_type = Column(String(32), nullable=False)
    entity_id = Column(String(64), nullable=False, index=True)
    event_version = Column(String(16), default="1.0")
    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    payload = Column(JSON, nullable=False)
    correlation_id = Column(String(64), nullable=True)

    __table_args__ = (
        Index('idx_event_type_source', 'event_type', 'source_module'),
    )

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=False, index=True)
    type = Column(String(32), nullable=False, index=True)          # e.g., 'funding', 'patents', 'technology', 'research', 'commercialization', 'reports', 'platform'
    category = Column(String(32), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(16), default="MEDIUM", index=True)     # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    severity = Column(String(16), default="info")                  # 'info', 'warning', 'success', 'error'
    status = Column(String(16), default="unread", index=True)       # 'unread', 'read', 'archived', 'expired'
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    related_module = Column(String(32), nullable=False)
    related_record_id = Column(String(64), nullable=True, index=True)
    action_url = Column(String(255), nullable=True)
    source_event_id = Column(String(64), nullable=True, index=True)
    relevance_score = Column(Float, default=0.0)
    relevance_reason = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    idempotency_key = Column(String(128), unique=True, index=True, nullable=True)

    __table_args__ = (
        Index('idx_user_is_read', 'user_id', 'is_read'),
        Index('idx_user_category', 'user_id', 'category'),
        Index('idx_user_created', 'user_id', 'created_at'),
    )

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=False, index=True)
    category = Column(String(32), nullable=False)                 # 'funding', 'patents', 'technology', 'research', 'commercialization', 'reports', 'platform'
    in_app = Column(Boolean, default=True)
    email = Column(Boolean, default=False)
    push = Column(Boolean, default=False)
    min_priority = Column(String(16), default="LOW")              # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_user_pref_cat', 'user_id', 'category', unique=True),
    )

class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    notification_id = Column(String(64), ForeignKey("notifications.id"), nullable=False, index=True)
    channel = Column(String(16), nullable=False)                  # 'in_app', 'email', 'push'
    status = Column(String(16), default="PENDING")               # 'PENDING', 'DELIVERED', 'FAILED', 'DISABLED'
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

class NotificationAuditLog(Base):
    __tablename__ = "notification_audit_logs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    event_id = Column(String(64), nullable=True, index=True)
    user_id = Column(String(64), nullable=True, index=True)
    action = Column(String(64), nullable=False)                  # 'EVENT_INGESTED', 'NOTIFICATION_CREATED', 'NOTIFICATION_SKIPPED', 'DELIVERY_DISPATCHED'
    result = Column(String(32), nullable=False)                  # 'SUCCESS', 'SKIPPED_PREFERENCE', 'SKIPPED_RELEVANCE', 'SKIPPED_DUPLICATE', 'FAILED'
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
