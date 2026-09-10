from datetime import date
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.main import app
from app.models.funding import FundingOpportunity, SavedFundingOpportunity
from app.models.user import User
from app.schemas.funding import FundingOpportunityCreate
from app.services.funding_matching_service import match_funding, get_funding_recommendations
from app.services.funding_sources.normalizer import GrantsGovNormalizer

# In-memory test SQLite DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


fake_user = User(
    id=1,
    name="Dr. Jane Grant",
    email="grantseeker@university.edu",
    password_hash="fakehashsecret",
    role="Researcher",
)


def override_get_current_user():
    return fake_user


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_funding_db():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    db.merge(fake_user)

    opp1 = FundingOpportunity(
        id=1,
        title="National Science Foundation: Trustworthy AI and Autonomous Systems",
        organization="National Science Foundation",
        funding_type="grant",
        country="United States",
        funding_amount=1250000.0,
        funding_amount_min=100000.0,
        funding_amount_max=1250000.0,
        currency="USD",
        deadline=date(2026, 12, 1),
        status="open",
        eligibility="Higher education institutions, non-profit research organizations",
        description="Support for research into explainable, verifiable, and secure autonomous AI systems.",
        research_areas=json.dumps(["Artificial Intelligence", "Autonomous Systems", "Cybersecurity"]),
        keywords=json.dumps(["ai", "autonomous", "security", "explainable"]),
        source="grants_gov",
        external_id="OPP-NSF-24-501",
        source_url="https://www.grants.gov/search-results-detail/123456",
    )
    opp2 = FundingOpportunity(
        id=2,
        title="Horizon Europe: Quantum Information Technologies and Materials",
        organization="European Innovation Council",
        funding_type="grant",
        country="European Union",
        funding_amount=3000000.0,
        funding_amount_min=500000.0,
        funding_amount_max=3000000.0,
        currency="EUR",
        deadline=date(2026, 11, 15),
        status="open",
        eligibility="International consortia, universities, SME partners",
        description="Scalable quantum computing hardware, topological qubits, and cryogenic algorithms.",
        research_areas=json.dumps(["Quantum Computing", "Materials Science"]),
        keywords=json.dumps(["quantum", "materials", "qubits"]),
        source="manual",
        external_id="HORIZON-Q-2025",
        source_url="https://ec.europa.eu/info/funding-tenders/opportunities",
    )

    db.add_all([opp1, opp2])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


def test_grants_gov_normalizer():
    raw_record = {
        "id": "350123",
        "title": "AI for Scientific Discovery and Energy Efficiency",
        "agencyName": "Department of Energy",
        "oppCategory": "Discretionary",
        "oppNum": "DE-FOA-0003001",
        "awardCeiling": "2500000",
        "awardFloor": "200000",
        "closeDate": "10/30/2026",
        "synopsis": "Accelerating scientific breakthroughs in clean energy using foundation AI models.",
    }

    norm = GrantsGovNormalizer()
    normalized = norm.normalize(raw_record)
    assert isinstance(normalized, FundingOpportunityCreate)
    assert normalized.title == "AI for Scientific Discovery and Energy Efficiency"
    assert normalized.organization == "Department of Energy"
    assert normalized.funding_amount == 2500000.0
    assert normalized.deadline == date(2026, 10, 30)
    assert normalized.source == "grants_gov"


def test_deterministic_matching_service():
    db = TestingSessionLocal()
    try:
        # Match funding opp 1
        result = match_funding(
            db=db,
            funding_id=1,
            research_domain=["Artificial Intelligence"],
            research_areas=["Autonomous Systems", "Cybersecurity"],
            keywords=["ai", "explainable"],
            user_country="United States",
        )

        assert result["match_score"] > 0.5
        assert len(result["matched_areas"]) > 0
        assert len(result["matched_keywords"]) > 0
        assert len(result["reasons"]) > 0
    finally:
        db.close()


def test_list_funding_opportunities():
    response = client.get("/api/funding")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "items" in data
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert any("National Science Foundation" in item["title"] for item in data["items"])


def test_search_funding_with_filters():
    payload = {
        "query": "Quantum",
        "organization": "European Innovation Council",
    }
    response = client.post("/api/funding/search", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["total"] == 1
    assert data["items"][0]["id"] == 2


def test_get_funding_detail():
    response = client.get("/api/funding/1")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["id"] == 1
    assert data["funding_amount"] == 1250000.0
    assert data["organization"] == "National Science Foundation"


def test_save_and_unsave_funding():
    # Save opp 1
    save_resp = client.post(
        "/api/funding/save",
        json={"funding_id": 1},
    )
    assert save_resp.status_code in [200, 201]

    # Verify saved
    list_saved = client.get("/api/funding/saved")
    assert list_saved.status_code == 200
    res = list_saved.json()
    assert res["success"] is True
    saved_data = res["data"]
    assert saved_data["total"] == 1
    assert saved_data["items"][0]["id"] == 1

    # Unsave
    del_resp = client.delete("/api/funding/saved/1")
    assert del_resp.status_code in [200, 204]

    # Verify removed
    list_after = client.get("/api/funding/saved")
    assert list_after.status_code == 200
    assert list_after.json()["data"]["total"] == 0


def test_funding_match_endpoint():
    payload = {
        "funding_id": 1,
        "research_areas": ["Artificial Intelligence"],
        "keywords": ["autonomous systems", "verifiable AI"],
    }
    response = client.post("/api/funding/match", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "match_score" in data
    assert data["match_score"] > 0
    assert "score_breakdown" in data
    assert "reasons" in data


def test_funding_recommendations_endpoint():
    response = client.get("/api/funding/recommendations?limit=5")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "items" in res["data"]


def test_funding_compare_endpoint():
    response = client.get("/api/funding/compare?ids=1,2")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "items" in data
    assert len(data["items"]) == 2
    ids = [o["id"] for o in data["items"]]
    assert 1 in ids
    assert 2 in ids
