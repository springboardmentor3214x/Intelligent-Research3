import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from routers.auth import get_authenticated_user
from models import ResearchPaper


# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Fake authenticated user
def override_get_authenticated_user():
    return {
        "id": 1,
        "email": "test@example.com",
        "role": "Researcher"
    }


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_authenticated_user] = override_get_authenticated_user

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()

    papers = [
        ResearchPaper(
            title="Generative AI for Healthcare",
            authors="John Smith, Priya Kumar",
            abstract="Study of generative AI applications in healthcare.",
            publication_year=2025,
            research_area="Artificial Intelligence",
            keywords="Generative AI, Healthcare, Machine Learning",
            journal="AI Research Journal",
            doi="10.1234/test.001",
            pdf_url="https://example.com/paper1.pdf"
        ),
        ResearchPaper(
            title="Machine Learning in Agriculture",
            authors="David Brown",
            abstract="Machine learning techniques for smart agriculture.",
            publication_year=2024,
            research_area="Machine Learning",
            keywords="Machine Learning, Agriculture",
            journal="Agriculture Journal",
            doi="10.1234/test.002",
            pdf_url="https://example.com/paper2.pdf"
        ),
        ResearchPaper(
            title="Deep Learning for Medical Imaging",
            authors="John Smith",
            abstract="Deep learning methods for medical image analysis.",
            publication_year=2025,
            research_area="Artificial Intelligence",
            keywords="Deep Learning, Medical Imaging",
            journal="Medical AI Journal",
            doi="10.1234/test.003",
            pdf_url="https://example.com/paper3.pdf"
        )
    ]

    db.add_all(papers)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=engine)


def test_search_research_papers():
    response = client.get("/api/research-papers")

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert len(data["data"]["items"]) == 3
    assert data["data"]["pagination"]["total"] == 3


def test_keyword_filter():
    response = client.get(
        "/api/research-papers",
        params={"keyword": "Healthcare"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["pagination"]["total"] == 1
    assert "Healthcare" in data["data"]["items"][0]["title"]


def test_year_filter():
    response = client.get(
        "/api/research-papers",
        params={"year": 2025}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["data"]["pagination"]["total"] == 2


def test_author_filter():
    response = client.get(
        "/api/research-papers",
        params={"author": "John Smith"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["data"]["pagination"]["total"] == 2


def test_research_area_filter():
    response = client.get(
        "/api/research-papers",
        params={"research_area": "Artificial Intelligence"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["data"]["pagination"]["total"] == 2


def test_pagination():
    response = client.get(
        "/api/research-papers",
        params={
            "page": 1,
            "page_size": 2
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["data"]["items"]) == 2
    assert data["data"]["pagination"]["total"] == 3
    assert data["data"]["pagination"]["total_pages"] == 2


def test_sorting():
    response = client.get(
        "/api/research-papers",
        params={
            "sort_by": "publication_year",
            "sort_order": "desc"
        }
    )

    assert response.status_code == 200

    data = response.json()

    items = data["data"]["items"]

    assert items[0]["publication_year"] >= items[1]["publication_year"]


def test_get_research_paper_details():
    response = client.get("/api/research-papers/1")

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["id"] == 1
    assert data["data"]["title"] == "Generative AI for Healthcare"


def test_research_paper_not_found():
    response = client.get("/api/research-papers/999")

    assert response.status_code == 404

    data = response.json()

    assert data["success"] is False
    assert data["message"] == "Research paper not found."