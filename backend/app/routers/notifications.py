"""
Module 10 - Notifications & Alert System Router
Endpoints for fetching, reading, filtering, scanning, and configuring
in-app alerts across Modules 3-8.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.notification import NotificationCategory, NotificationPriority
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationListResponse,
    NotificationOut,
    NotificationPreferencesOut,
    NotificationPreferencesUpdate,
    NotificationScanResult,
    NotificationStatsOut,
)
from app.services import notification_service

router = APIRouter(
    prefix="/notifications",
    tags=["Module 10 - Notifications & Alerts"],
)


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    category: Optional[str] = Query(None, description="Filter by category (FUNDING, PATENT, TECHNOLOGY, RESEARCH_TREND, COMMERCIALIZATION, PLATFORM)"),
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    priority: Optional[str] = Query(None, description="Filter by priority (LOW, MEDIUM, HIGH, URGENT)"),
    search: Optional[str] = Query(None, description="Search term for title or message"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated notifications for the current authenticated user."""
    # Ensure baseline alerts exist for active user if they have zero notifications
    stats = notification_service.get_notification_stats(db, current_user.id)
    if stats["total"] == 0:
        notification_service.scan_and_generate_alerts(db, current_user.id)

    result = notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        category=category,
        unread_only=unread_only,
        priority=priority,
        search=search,
        page=page,
        page_size=page_size,
    )
    return result


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fast endpoint for TopNav badge indicator."""
    count = notification_service.get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.get("/stats", response_model=NotificationStatsOut)
def get_notification_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregated statistics for notifications across all categories and priorities."""
    return notification_service.get_notification_stats(db, current_user.id)


@router.post("/scan", response_model=NotificationScanResult)
def trigger_alert_scan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Actively scan Modules 3, 4, 5, 6, 8 for relevant updates matching
    user research interests and create in-app alerts.
    """
    scan_res = notification_service.scan_and_generate_alerts(db, current_user.id)
    now = datetime.now(timezone.utc)
    return {
        "scanned_at": now,
        "generated_count": scan_res["generated_count"],
        "categories_scanned": [c.value for c in NotificationCategory],
        "details": scan_res["details"],
        "message": f"Successfully evaluated intelligence feeds. Generated {scan_res['generated_count']} new notifications.",
    }


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    updated = notification_service.mark_as_read(db, current_user.id, notification_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return updated


@router.post("/mark-all-read")
def mark_all_notifications_read(
    category: Optional[str] = Query(None, description="Optional category filter to mark read"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all unread notifications (or within a category) as read."""
    count = notification_service.mark_all_as_read(db, current_user.id, category)
    return {"marked_read_count": count, "message": f"Marked {count} notifications as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_single_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete a notification."""
    success = notification_service.delete_notification(db, current_user.id, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return None


@router.delete("/clear-read")
def clear_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all read notifications for current user."""
    count = notification_service.clear_read_notifications(db, current_user.id)
    return {"cleared_count": count, "message": f"Cleared {count} read notifications"}


@router.get("/preferences", response_model=NotificationPreferencesOut)
def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve notification settings and category subscription preferences."""
    return notification_service.get_or_create_preferences(db, current_user.id)


@router.put("/preferences", response_model=NotificationPreferencesOut)
def update_user_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update notification settings and active alert categories."""
    updates = payload.model_dump(exclude_unset=True)
    if "min_priority" in updates and isinstance(updates["min_priority"], NotificationPriority):
        updates["min_priority"] = updates["min_priority"].value
    return notification_service.update_preferences(db, current_user.id, updates)
