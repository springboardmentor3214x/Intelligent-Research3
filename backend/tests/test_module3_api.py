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
from app.models.research_paper import ResearchPaper, SavedResearchPaper
from app.models.user import User

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
    name="Dr. Jane Doe",
    email="researcher@university.edu",
    password_hash="fakehashsecret",
    role="Researcher",
)


def override_get_current_user():
    return fake_user


client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Ensure user exists in db
    db.merge(fake_user)

    # Insert sample papers
    p1 = ResearchPaper(
        id=1,
        title="Attention Is All You Need in Healthcare AI",
        authors=json.dumps(["Vaswani et al.", "Jane Doe"]),
        abstract="Transformers applied to clinical intelligence and bio-imaging diagnostics.",
        publication_year=2024,
        research_area=json.dumps(["Artificial Intelligence", "Healthcare AI"]),
        keywords=json.dumps(["transformer", "attention", "healthcare", "clinical"]),
        journal="NeurIPS 2024",
        doi="10.1000/neurips.2024.01",
        source="arxiv",
        external_id="arxiv-2401.0001",
        source_url="https://arxiv.org/abs/2401.0001",
    )
    p2 = ResearchPaper(
        id=2,
        title="Quantum Graph Neural Networks for Drug Discovery",
        authors=json.dumps(["Alice Smith", "Bob Jones"]),
        abstract="Deep geometric learning on molecular graphs using simulated quantum circuits.",
        publication_year=2025,
        research_area=json.dumps(["Quantum Computing", "Biotechnology"]),
        keywords=json.dumps(["quantum", "graph neural network", "drug discovery"]),
        journal="Nature Machine Intelligence",
        doi="10.1000/natmi.2025.02",
        source="openalex",
        external_id="openalex-W2025",
        source_url="https://nature.com/articles/s42256-025",
    )
    db.add_all([p1, p2])
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)


def test_list_papers():
    response = client.get("/api/research/papers")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "items" in data
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert any("Attention Is All You Need" in p["title"] for p in data["items"])


def test_filter_papers_by_area():
    response = client.get("/api/research/papers?research_area=Quantum Computing")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["total"] == 1
    assert data["items"][0]["id"] == 2


def test_get_paper_detail():
    response = client.get("/api/research/papers/1")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert data["id"] == 1
    assert data["journal"] == "NeurIPS 2024"


def test_save_and_unsave_paper():
    # Save paper 1
    save_resp = client.post("/api/research/papers/1/save")
    assert save_resp.status_code in [200, 201]

    # Verify paper is saved
    saved_resp = client.get("/api/research/papers/saved")
    assert saved_resp.status_code == 200
    res = saved_resp.json()
    assert res["success"] is True
    saved_data = res["data"]
    assert saved_data["total"] >= 1

    # Unsave paper 1
    unsave_resp = client.delete("/api/research/papers/1/save")
    assert unsave_resp.status_code in [200, 204]

    # Verify no longer saved
    saved_after = client.get("/api/research/papers/saved")
    assert saved_after.status_code == 200
    assert saved_after.json()["data"]["total"] == 0


def test_research_trends():
    response = client.get("/api/research/trends")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "publications_by_year" in data
    assert len(data["publications_by_year"]) >= 1
    assert "top_keywords" in data


def test_research_recommendations():
    response = client.get("/api/research/recommendations")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "items" in res["data"]


def test_ai_paper_analysis():
    response = client.post(
        "/api/research/papers/1/analyze",
        json={"prompt": "Focus on commercialization"},
    )
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "ai_analysis" in data
    assert "source" in data
    assert "findings" in data["ai_analysis"]
