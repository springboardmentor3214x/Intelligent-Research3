"""
backend/tests/test_module10_notifications.py
Unit & Integration Tests for Module 10 — Notification & Alert System REST API.

Tests cover:
  1. Unauthenticated requests rejected with 401 Unauthorized
  2. GET /api/notifications returns list response structure
  3. GET /api/notifications/unread-count returns integer count
  4. GET /api/notifications/stats returns breakdown by category and priority
  5. POST /api/notifications/scan triggers intelligent matching against platform data
  6. PATCH /api/notifications/{id}/read marks single notification as read
  7. POST /api/notifications/mark-all-read marks all user notifications read
  8. Filtering by category (FUNDING, PATENT, TECHNOLOGY, RESEARCH_TREND, COMMERCIALIZATION, PLATFORM)
  9. GET and PUT /api/notifications/preferences
  10. DELETE /api/notifications/{id} deletes notification
  11. Relevance matching tokens extract and overlap
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.notification import NotificationCategory, NotificationPriority
from app.services import notification_service
from app.db.session import SessionLocal

client = TestClient(app)


def mock_researcher():
    return User(
        id=1,
        name="Dr. Jane Doe",
        email="jane.doe@university.edu",
        role="Researcher",
        research_domain="Artificial Intelligence",
        organization="Stanford AI Lab",
        is_active=True,
    )


def mock_founder():
    return User(
        id=42,
        name="Tech Founder",
        email="founder@startup.io",
        role="Startup Founder",
        research_domain="Quantum Computing",
        organization="Quantum Dynamics Inc",
        is_active=True,
    )


@pytest.fixture(autouse=True)
def clean_overrides():
    yield
    app.dependency_overrides.clear()


# ── 1. Authentication ─────────────────────────────────────────────────────────

def test_unauthenticated_notifications_rejected():
    """Unauthenticated requests must be rejected with 401."""
    res = client.get("/api/notifications")
    assert res.status_code == 401

    res_unread = client.get("/api/notifications/unread-count")
    assert res_unread.status_code == 401

    res_stats = client.get("/api/notifications/stats")
    assert res_stats.status_code == 401

    res_prefs = client.get("/api/notifications/preferences")
    assert res_prefs.status_code == 401


# ── 2. List Notifications & Scan ──────────────────────────────────────────────

def test_list_notifications_and_scan():
    """Authenticated user should be able to trigger scan and view notifications."""
    app.dependency_overrides[get_current_user] = mock_researcher

    # Trigger scan
    scan_res = client.post("/api/notifications/scan")
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert "generated_count" in scan_data
    assert "categories_scanned" in scan_data

    # List notifications
    list_res = client.get("/api/notifications")
    assert list_res.status_code == 200
    data = list_res.json()
    assert "items" in data
    assert "total" in data
    assert "unread_count" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)


# ── 3. Unread Count ───────────────────────────────────────────────────────────

def test_unread_count_endpoint():
    app.dependency_overrides[get_current_user] = mock_researcher

    res = client.get("/api/notifications/unread-count")
    assert res.status_code == 200
    body = res.json()
    assert "unread_count" in body
    assert isinstance(body["unread_count"], int)


# ── 4. Stats Breakdown ────────────────────────────────────────────────────────

def test_notification_statistics():
    app.dependency_overrides[get_current_user] = mock_researcher

    res = client.get("/api/notifications/stats")
    assert res.status_code == 200
    body = res.json()
    assert "total" in body
    assert "unread" in body
    assert "by_category" in body
    assert "unread_by_category" in body
    assert "FUNDING" in body["by_category"]
    assert "PATENT" in body["by_category"]
    assert "TECHNOLOGY" in body["by_category"]
    assert "RESEARCH_TREND" in body["by_category"]
    assert "COMMERCIALIZATION" in body["by_category"]
    assert "PLATFORM" in body["by_category"]


# ── 5. Mark as Read ───────────────────────────────────────────────────────────

def test_mark_single_notification_read():
    app.dependency_overrides[get_current_user] = mock_researcher

    # Create a fresh notification directly via service
    db = SessionLocal()
    try:
        n = notification_service.create_notification(
            db=db,
            user_id=1,
            title="Test Read Notification",
            message="Testing mark read functionality",
            category=NotificationCategory.PLATFORM,
            priority=NotificationPriority.LOW,
            deduplicate=False,
        )
        notif_id = n.id
    finally:
        db.close()

    res = client.patch(f"/api/notifications/{notif_id}/read")
    assert res.status_code == 200
    updated = res.json()
    assert updated["id"] == notif_id
    assert updated["is_read"] is True
    assert updated["read_at"] is not None


def test_mark_all_read():
    app.dependency_overrides[get_current_user] = mock_researcher

    res = client.post("/api/notifications/mark-all-read")
    assert res.status_code == 200
    data = res.json()
    assert "marked_read_count" in data


# ── 6. Category Filtering ─────────────────────────────────────────────────────

def test_category_filters():
    app.dependency_overrides[get_current_user] = mock_researcher

    categories = ["FUNDING", "PATENT", "TECHNOLOGY", "RESEARCH_TREND", "COMMERCIALIZATION", "PLATFORM"]
    for cat in categories:
        res = client.get(f"/api/notifications?category={cat}")
        assert res.status_code == 200
        data = res.json()
        for item in data["items"]:
            assert item["category"] == cat


# ── 7. Preferences ────────────────────────────────────────────────────────────

def test_preferences_get_and_update():
    app.dependency_overrides[get_current_user] = mock_researcher

    # GET preferences
    get_res = client.get("/api/notifications/preferences")
    assert get_res.status_code == 200
    prefs = get_res.json()
    assert "funding_alerts" in prefs
    assert "technology_alerts" in prefs
    assert "custom_keywords" in prefs

    # PUT preferences
    update_res = client.put(
        "/api/notifications/preferences",
        json={
            "funding_alerts": True,
            "min_priority": "MEDIUM",
            "custom_keywords": ["GenAI", "Robotics"],
        },
    )
    assert update_res.status_code == 200
    updated_prefs = update_res.json()
    assert updated_prefs["min_priority"] == "MEDIUM"
    assert "GenAI" in updated_prefs["custom_keywords"]


# ── 8. Delete Notification ───────────────────────────────────────────────────

def test_delete_notification():
    app.dependency_overrides[get_current_user] = mock_researcher

    db = SessionLocal()
    try:
        n = notification_service.create_notification(
            db=db,
            user_id=1,
            title="Notification To Delete",
            message="Will be deleted",
            category=NotificationCategory.PLATFORM,
            priority=NotificationPriority.LOW,
            deduplicate=False,
        )
        notif_id = n.id
    finally:
        db.close()

    del_res = client.delete(f"/api/notifications/{notif_id}")
    assert del_res.status_code == 204

    # Confirm it's gone
    read_res = client.patch(f"/api/notifications/{notif_id}/read")
    assert read_res.status_code == 404


# ── 9. Relevance Matching Engine ──────────────────────────────────────────────

def test_relevance_tokens_and_overlap():
    from app.services.notification_service import (
        check_term_overlap,
        extract_user_interest_tokens,
    )
    from app.models.notification import NotificationPreference

    u = User(
        id=999,
        name="Dr. Quantum AI",
        email="quantum@lab.edu",
        role="Researcher",
        research_domain="Quantum Computing and Cryptography",
        organization="MIT",
    )
    prefs = NotificationPreference(user_id=999, custom_keywords=["superconducting qubits"])

    tokens = extract_user_interest_tokens(u, prefs)
    assert "quantum" in tokens
    assert "cryptography" in tokens

    assert check_term_overlap(tokens, "Scalable Quantum Computing Hardware") is True
    assert check_term_overlap(tokens, "Agriculture and crop harvesting") is False
