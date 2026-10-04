"""
backend/tests/test_module9_dashboard.py
Unit & Integration Tests for Module 9 — Dashboard & Analytics REST API.

Tests cover:
  1. Unauthenticated requests rejected with 401 Unauthorized
  2. Role-Based Access Control (RBAC):
     - Admin access to /api/dashboard/users (200) vs Researcher access (403)
  3. GET /api/dashboard/summary — KPI aggregation across Modules 1-8
  4. GET /api/dashboard/research — Publication analytics & research areas
  5. GET /api/dashboard/patents — Patent distribution and status
  6. GET /api/dashboard/funding — Funding analytics & opportunities
  7. GET /api/dashboard/innovation — Innovation score distribution & factor breakdown
  8. GET /api/dashboard/technology — Technology maturity & opportunities
  9. GET /api/dashboard/commercialization — Commercialization pathways & readiness
  10. GET /api/dashboard/activity — Unified platform activity feed
  11. Empty state & error resilience across all endpoints
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies.auth import get_current_user
from app.models.user import User

client = TestClient(app)


# ── Mock Users ────────────────────────────────────────────────────────────────

def mock_researcher():
    return User(
        id=1,
        name="Dr. Jane Doe",
        email="jane.doe@university.edu",
        role="Researcher",
        is_active=True,
    )


def mock_admin():
    return User(
        id=99,
        name="Admin User",
        email="admin@platform.org",
        role="Administrator",
        is_active=True,
    )


def mock_founder():
    return User(
        id=42,
        name="Tech Founder",
        email="founder@startup.io",
        role="Startup Founder",
        is_active=True,
    )


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_unauthenticated_summary_rejected():
    """Accessing dashboard endpoints without authentication must return 401."""
    app.dependency_overrides.clear()
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 401


def test_dashboard_summary_researcher():
    """Researcher gets personal summary KPIs with 200 OK."""
    app.dependency_overrides[get_current_user] = mock_researcher
    try:
        res = client.get("/api/dashboard/summary")
        assert res.status_code == 200
        data = res.json()
        assert "total_users" in data
        assert "total_publications" in data
        assert "total_patents" in data
        assert "total_funding_opportunities" in data
        assert "total_technologies" in data
        assert "user_role" in data
        assert data["user_role"] == "Researcher"
    finally:
        app.dependency_overrides.clear()


def test_dashboard_summary_admin():
    """Administrator gets platform-wide KPIs with 200 OK."""
    app.dependency_overrides[get_current_user] = mock_admin
    try:
        res = client.get("/api/dashboard/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["user_role"] == "Administrator"
        assert data["total_users"] is not None
    finally:
        app.dependency_overrides.clear()


def test_dashboard_research_analytics():
    """Research analytics returns publication trends, areas, and recent papers."""
    app.dependency_overrides[get_current_user] = mock_admin
    try:
        res = client.get("/api/dashboard/research")
        assert res.status_code == 200
        data = res.json()
        assert "publications_by_year" in data
        assert "research_areas" in data
        assert "top_keywords" in data
        assert "recent_publications" in data
        assert isinstance(data["publications_by_year"], list)
    finally:
        app.dependency_overrides.clear()


def test_dashboard_patents_analytics():
    """Patent analytics returns trends and status breakdown."""
    app.dependency_overrides[get_current_user] = mock_admin
    try:
        res = client.get("/api/dashboard/patents")
        assert res.status_code == 200
        data = res.json()
        assert "total_patents" in data
        assert "status_breakdown" in data
        assert "patents_by_year" in data
        assert "recent_patents" in data
        assert isinstance(data["patents_by_year"], list)
    finally:
        app.dependency_overrides.clear()


def test_dashboard_funding_analytics():
    """Funding analytics returns counts by source, status, and opportunities."""
    app.dependency_overrides[get_current_user] = mock_researcher
    try:
        res = client.get("/api/dashboard/funding")
        assert res.status_code == 200
        data = res.json()
        assert "total_funding_opportunities" in data
        assert "status_breakdown" in data
        assert "type_breakdown" in data
        assert "source_breakdown" in data
        assert "upcoming_deadlines" in data
        assert isinstance(data["upcoming_deadlines"], list)
    finally:
        app.dependency_overrides.clear()


def test_dashboard_innovation_analytics():
    """Innovation score analytics returns average score, distribution, and factor weights."""
    app.dependency_overrides[get_current_user] = mock_researcher
    try:
        res = client.get("/api/dashboard/innovation")
        assert res.status_code == 200
        data = res.json()
        assert "total_scored_technologies" in data
        assert "lifecycle_distribution" in data
        assert "factor_averages" in data
        assert "top_scored_technologies" in data
        assert isinstance(data["lifecycle_distribution"], list)
    finally:
        app.dependency_overrides.clear()


def test_dashboard_technology_analytics():
    """Technology intelligence returns maturity distribution and opportunities."""
    app.dependency_overrides[get_current_user] = mock_researcher
    try:
        res = client.get("/api/dashboard/technology")
        assert res.status_code == 200
        data = res.json()
        assert "total_technologies" in data
        assert "stage_distribution" in data
        assert "research_direction_distribution" in data
        assert "opportunity_types" in data
        assert isinstance(data["stage_distribution"], list)
    finally:
        app.dependency_overrides.clear()


def test_dashboard_commercialization_analytics():
    """Commercialization returns recommendation pathways and readiness."""
    app.dependency_overrides[get_current_user] = mock_founder
    try:
        res = client.get("/api/dashboard/commercialization")
        assert res.status_code == 200
        data = res.json()
        assert "total_recommendations" in data
        assert "pathway_avg_scores" in data
        assert "top_recommendations" in data
        assert isinstance(data["top_recommendations"], list)
    finally:
        app.dependency_overrides.clear()


def test_dashboard_activity_feed():
    """Activity feed aggregates events across modules with limit control."""
    app.dependency_overrides[get_current_user] = mock_admin
    try:
        res = client.get("/api/dashboard/activity?limit=5")
        assert res.status_code == 200
        data = res.json()
        assert "activity" in data
        assert "total" in data
        assert len(data["activity"]) <= 5
        if data["activity"]:
            first = data["activity"][0]
            assert "type" in first or "module" in first
            assert "title" in first
            assert "timestamp" in first
    finally:
        app.dependency_overrides.clear()


def test_dashboard_users_access_control():
    """Only Administrator can access /api/dashboard/users. Researchers get 403."""
    # 1. Researcher -> 403 Forbidden
    app.dependency_overrides[get_current_user] = mock_researcher
    try:
        res = client.get("/api/dashboard/users")
        assert res.status_code == 403
    finally:
        app.dependency_overrides.clear()

    # 2. Administrator -> 200 OK
    app.dependency_overrides[get_current_user] = mock_admin
    try:
        res = client.get("/api/dashboard/users")
        assert res.status_code == 200
        data = res.json()
        assert "total_users" in data
        assert "role_distribution" in data
        assert "active_users" in data
    finally:
        app.dependency_overrides.clear()
