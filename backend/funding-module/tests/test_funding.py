"""
Run with: pytest -v

Uses a separate in-memory SQLite database per test run so tests never touch
your real dev data (funding.db) and can be run repeatedly with a clean slate.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta

from app.database import Base, get_db
from app.main import app
from app.models import FundingOpportunity

# StaticPool keeps a single shared connection alive for the whole test run —
# without it, each new session opens a *separate* in-memory SQLite database
# and your tables "disappear" between calls.
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def seeded_funding(client):
    db = TestingSessionLocal()
    items = [
        FundingOpportunity(
            title="AI Healthcare Grant",
            organization="NSF",
            research_areas="Artificial Intelligence,Healthcare",
            keywords="LLM,Medical",
            country="USA",
            funding_type="Government Grant",
            funding_amount=100000,
            deadline=datetime.utcnow() + timedelta(days=30),
            status="open",
        ),
        FundingOpportunity(
            title="Robotics Fund",
            organization="TechOrg",
            research_areas="Robotics",
            keywords="Robotics,Automation",
            country="Germany",
            funding_type="Innovation Fund",
            funding_amount=50000,
            deadline=datetime.utcnow() + timedelta(days=5),
            status="open",
        ),
    ]
    db.add_all(items)
    db.commit()
    for i in items:
        db.refresh(i)
    ids = [i.id for i in items]
    db.close()
    return ids


# ---------- List & Details ----------

def test_list_funding_returns_records(client, seeded_funding):
    res = client.get("/api/funding")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2


def test_get_funding_details_by_id(client, seeded_funding):
    funding_id = seeded_funding[0]
    res = client.get(f"/api/funding/{funding_id}")
    assert res.status_code == 200
    assert res.json()["title"] == "AI Healthcare Grant"


def test_unknown_funding_id_returns_404(client, seeded_funding):
    res = client.get("/api/funding/does-not-exist")
    assert res.status_code == 404


# ---------- Search & Filters ----------

def test_search_by_keyword(client, seeded_funding):
    res = client.post("/api/funding/search", json={"query": "Healthcare"})
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "AI Healthcare Grant"


def test_search_by_country_filter(client, seeded_funding):
    res = client.post("/api/funding/search", json={"country": "Germany"})
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Robotics Fund"


def test_combined_filters(client, seeded_funding):
    res = client.post(
        "/api/funding/search",
        json={"research_area": "Healthcare", "country": "USA"},
    )
    body = res.json()
    assert body["total"] == 1


def test_search_no_match_returns_empty(client, seeded_funding):
    res = client.post("/api/funding/search", json={"query": "Nonexistent Topic"})
    body = res.json()
    assert body["total"] == 0
    assert body["items"] == []


# ---------- Pagination ----------

def test_pagination_does_not_duplicate_or_skip(client, seeded_funding):
    page1 = client.post("/api/funding/search", json={"page": 1, "page_size": 1}).json()
    page2 = client.post("/api/funding/search", json={"page": 2, "page_size": 1}).json()
    assert page1["items"][0]["id"] != page2["items"][0]["id"]
    assert page1["total"] == page2["total"] == 2


# ---------- Saved funding & auth ----------

def test_save_requires_authentication(client, seeded_funding):
    res = client.post("/api/funding/save", json={"funding_id": seeded_funding[0]})
    assert res.status_code == 401


def test_save_and_list_saved_funding(client, seeded_funding):
    headers = {"Authorization": "Bearer user-123"}
    res = client.post(
        "/api/funding/save", json={"funding_id": seeded_funding[0]}, headers=headers
    )
    assert res.status_code == 201

    saved = client.get("/api/funding/saved", headers=headers)
    assert saved.status_code == 200
    assert len(saved.json()) == 1


def test_saving_twice_does_not_duplicate(client, seeded_funding):
    headers = {"Authorization": "Bearer user-123"}
    client.post("/api/funding/save", json={"funding_id": seeded_funding[0]}, headers=headers)
    client.post("/api/funding/save", json={"funding_id": seeded_funding[0]}, headers=headers)

    saved = client.get("/api/funding/saved", headers=headers).json()
    assert len(saved) == 1


def test_user_cannot_see_another_users_saved_funding(client, seeded_funding):
    client.post(
        "/api/funding/save",
        json={"funding_id": seeded_funding[0]},
        headers={"Authorization": "Bearer user-A"},
    )
    saved_for_b = client.get(
        "/api/funding/saved", headers={"Authorization": "Bearer user-B"}
    ).json()
    assert saved_for_b == []
