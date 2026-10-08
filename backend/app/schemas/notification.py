"""
Pydantic Schemas for Module 10: Notification & Alert Intelligence System
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PlatformEventCreate(BaseModel):
    event_type: str
    source_module: str
    entity_type: str
    entity_id: str
    event_version: Optional[str] = "1.0"
    payload: Dict[str, Any]
    correlation_id: Optional[str] = None

class PlatformEventResponse(BaseModel):
    event_id: str
    event_type: str
    source_module: str
    entity_type: str
    entity_id: str
    event_version: str
    occurred_at: datetime
    payload: Dict[str, Any]
    correlation_id: Optional[str]

    class Config:
        orm_mode = True

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    category: str
    title: str
    message: str
    priority: str
    severity: str
    status: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    related_module: str
    related_record_id: Optional[str] = None
    action_url: Optional[str] = None
    source_event_id: Optional[str] = None
    relevance_score: Optional[float] = 0.0
    relevance_reason: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    page: int
    page_size: int
    unread_count: int

class NotificationPreferenceItem(BaseModel):
    category: str
    in_app: bool = True
    email: bool = False
    push: bool = False
    min_priority: str = "LOW"

class NotificationPreferencesUpdate(BaseModel):
    preferences: List[NotificationPreferenceItem]

class NotificationAnalyticsResponse(BaseModel):
    total_notifications: int
    unread_count: int
    read_count: int
    by_category: Dict[str, int]
    by_priority: Dict[str, int]
    by_severity: Dict[str, int]
    delivery_success_rate: float
    duplicate_prevented_count: int
