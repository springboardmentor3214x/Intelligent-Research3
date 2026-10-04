"""
Module 10 - Notification & Alert System Pydantic Schemas
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.notification import NotificationCategory, NotificationPriority


class NotificationBase(BaseModel):
    title: str = Field(..., max_length=255, description="Alert title")
    message: str = Field(..., description="Detailed alert body text")
    category: NotificationCategory = Field(default=NotificationCategory.PLATFORM)
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM)
    link: Optional[str] = Field(None, max_length=500, description="In-app navigation destination URL")
    related_id: Optional[str] = Field(None, max_length=100, description="ID of the related record")
    metadata_json: Optional[Dict[str, Any]] = Field(default=None, description="Structured attributes")


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationOut]
    total: int
    unread_count: int
    page: int
    page_size: int
    has_next: bool


class CategoryCount(BaseModel):
    category: str
    count: int
    unread: int


class NotificationStatsOut(BaseModel):
    total: int
    unread: int
    read: int
    urgent: int
    high: int
    medium: int
    low: int
    by_category: Dict[str, int]
    unread_by_category: Dict[str, int]


class NotificationPreferencesBase(BaseModel):
    funding_alerts: bool = True
    patent_alerts: bool = True
    technology_alerts: bool = True
    research_trend_alerts: bool = True
    commercialization_alerts: bool = True
    platform_alerts: bool = True
    email_notifications: bool = False
    in_app_notifications: bool = True
    min_priority: NotificationPriority = NotificationPriority.LOW
    custom_keywords: Optional[List[str]] = Field(default_factory=list)


class NotificationPreferencesUpdate(BaseModel):
    funding_alerts: Optional[bool] = None
    patent_alerts: Optional[bool] = None
    technology_alerts: Optional[bool] = None
    research_trend_alerts: Optional[bool] = None
    commercialization_alerts: Optional[bool] = None
    platform_alerts: Optional[bool] = None
    email_notifications: Optional[bool] = None
    in_app_notifications: Optional[bool] = None
    min_priority: Optional[NotificationPriority] = None
    custom_keywords: Optional[List[str]] = None


class NotificationPreferencesOut(NotificationPreferencesBase):
    id: int
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationScanResult(BaseModel):
    scanned_at: datetime
    generated_count: int
    categories_scanned: List[str]
    details: Dict[str, int]
    message: str
