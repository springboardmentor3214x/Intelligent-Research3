"""
Unit and Integration Tests for Module 5 — Patent Landscape Analysis.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, get_db
from app.main import app
from app.models.patent_landscape import PatentRecord, ipc_to_domain
from app.repositories.patent_repository import (
    create_or_update_patent,
    get_competitor_analysis,
    get_innovation_map,
    get_patent_trends,
    search_patents,
)
from app.schemas.patent import PatentRecordCreate
from app.services.patent_clustering_service import run_patent_clustering

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def clean_dependency_overrides():
    """Ensure clean dependency overrides for patent landscape tests."""
    app.dependency_overrides.pop(get_db, None)
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_ipc_to_domain_mapping():
    """Verify standard WIPO IPC classification mapping."""
    assert ipc_to_domain("G06N3/04") == "Artificial Intelligence & Machine Learning"
    assert ipc_to_domain("G06T7/00") == "Computer Vision & Image Processing"
    assert ipc_to_domain("A61B5/00") == "Medical & Healthcare Devices"
    assert ipc_to_domain("H01M4/38") == "Power Generation & Storage"
    assert ipc_to_domain("H04L29/08") == "Data Transmission & Networks"
    assert ipc_to_domain("UNKNOWN") == "General Technology"
    assert ipc_to_domain(None) == "General Technology"


def test_search_patents_in_db(db_session: Session):
    """Test patent search repository query."""
    # Search for neural networks
    items, total = search_patents(db_session, keyword="neural", page=1, page_size=10)
    assert total > 0
    assert any("neural" in (p.title + (p.abstract or "")).lower() for p in items)

    # Search with domain filter
    ai_items, ai_total = search_patents(
        db_session,
        domain="Artificial Intelligence & Machine Learning",
        page=1,
        page_size=10,
    )
    assert ai_total > 0
    for p in ai_items:
        assert p.technology_domain == "Artificial Intelligence & Machine Learning"


def test_patent_deduplication(db_session: Session):
    """Test that upserting duplicate records skips or updates without creating duplicates."""
    item = PatentRecordCreate(
        source="uspto",
        source_patent_id="TEST_DUP_001",
        patent_number="US9999999B2",
        title="Test Patent for Deduplication",
        assignee="Test Org LLC",
        patent_classification="G06N3/00",
        technology_domain="Artificial Intelligence & Machine Learning",
        citation_count=10,
    )

    # 1. First insert
    rec1, inserted1, _ = create_or_update_patent(db_session, item)
    assert inserted1 is True

    # 2. Duplicate insert with same patent_number
    rec2, inserted2, updated2 = create_or_update_patent(db_session, item)
    assert inserted2 is False
    assert rec2.id == rec1.id

    # 3. Clean up test record
    db_session.delete(rec1)
    db_session.commit()


def test_trend_analysis(db_session: Session):
    """Test calculating patent counts grouped by filing year."""
    trends = get_patent_trends(db_session)
    assert isinstance(trends, list)
    assert len(trends) > 0

    for t in trends:
        assert "year" in t
        assert "count" in t
        assert isinstance(t["year"], int)
        assert isinstance(t["count"], int)
        assert t["count"] > 0


def test_competitor_analysis(db_session: Session):
    """Test competitor extraction from assignee field."""
    competitors = get_competitor_analysis(db_session, limit=5)
    assert isinstance(competitors, list)
    assert len(competitors) > 0

    top = competitors[0]
    assert "assignee" in top
    assert "patent_count" in top
    assert "filing_timeline" in top
    assert "domain_distribution" in top
    assert top["patent_count"] >= 1


def test_innovation_map(db_session: Session):
    """Test innovation mapping linking domain -> classification -> assignee."""
    map_nodes = get_innovation_map(db_session)
    assert isinstance(map_nodes, list)
    assert len(map_nodes) > 0

    first = map_nodes[0]
    assert "domain" in first
    assert "patent_count" in first
    assert "top_classifications" in first
    assert "top_assignees" in first


def test_clustering_workflow(db_session: Session):
    """Test semantic clustering on actual patent records."""
    res = run_patent_clustering(db_session, n_clusters=3, min_patents=5)
    assert res.status == "success"
    assert res.total_records_clustered >= 5
    assert len(res.clusters) >= 2

    for c in res.clusters:
        assert c.cluster_id >= 0
        assert len(c.label) > 0
        assert c.patent_count > 0
        assert len(c.representative_patents) > 0


def test_clustering_insufficient_records(db_session: Session):
    """Verify proper empty state when patent records are below threshold."""
    res = run_patent_clustering(db_session, min_patents=999999)
    assert res.status == "insufficient_data"
    assert res.message == "Not enough patent records for clustering."
    assert len(res.clusters) == 0


def test_api_patent_search_endpoint():
    """Test GET /api/patent-landscape/search."""
    resp = client.get("/api/patent-landscape/search?q=neural&page=1&page_size=5")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert len(data["items"]) > 0

    first = data["items"][0]
    # Check all required patent information fields
    assert "title" in first
    assert "assignee" in first
    assert "filing_date" in first
    assert "patent_classification" in first
    assert "technology_domain" in first
    assert "citation_count" in first


def test_api_trends_endpoint():
    """Test GET /api/patent-landscape/trends."""
    resp = client.get("/api/patent-landscape/trends")
    assert resp.status_code == 200
    data = resp.json()
    assert "trends" in data
    assert "total_patents" in data
    assert len(data["trends"]) > 0


def test_api_competitors_endpoint():
    """Test GET /api/patent-landscape/competitors."""
    resp = client.get("/api/patent-landscape/competitors?limit=5")
    assert resp.status_code == 200
    data = resp.json()
    assert "competitors" in data
    assert len(data["competitors"]) > 0


def test_api_innovation_map_endpoint():
    """Test GET /api/patent-landscape/innovation-map."""
    resp = client.get("/api/patent-landscape/innovation-map")
    assert resp.status_code == 200
    data = resp.json()
    assert "domains" in data
    assert len(data["domains"]) > 0


def test_api_clusters_endpoint():
    """Test GET /api/patent-landscape/clusters."""
    resp = client.get("/api/patent-landscape/clusters?n_clusters=3")
    assert resp.status_code == 200
    data = resp.json()
    assert "clusters" in data
    assert len(data["clusters"]) >= 2


def test_serpapi_normalization_standard():
    """Verify normalizing typical SerpApi Google Patents search result."""
    from app.services.patent_sources.normalizer import normalize_serpapi_record

    raw = {
        "patent_id": "patent/US11234567B2/en",
        "title": "Quantum Neural Network Architecture for Medical Imaging",
        "snippet": "A system and method for medical imaging using quantum circuits...",
        "filing_date": "2023-05-15",
        "publication_date": "2024-01-10",
        "assignee": "Google LLC",
        "inventors": ["Alice Smith", "Bob Jones"],
        "classification": "G06N3/063",
        "citation_count": 14,
        "patent_link": "https://patents.google.com/patent/US11234567B2/en",
    }
    record = normalize_serpapi_record(raw)
    assert record is not None
    assert record.title == "Quantum Neural Network Architecture for Medical Imaging"
    assert record.assignee == "Google LLC"
    assert record.assignee_normalized == "Google"
    assert str(record.filing_date) == "2023-05-15"
    assert record.filing_year == 2023
    assert record.patent_classification == "G06N3/063"
    assert record.technology_domain == "Artificial Intelligence & Machine Learning"
    assert record.citation_count == 14
    assert record.source == "google_patents"
    assert record.source_url == "https://patents.google.com/patent/US11234567B2/en"


def test_serpapi_normalization_missing_fields():
    """Verify that missing fields gracefully default to 'Not available' or None without crashing."""
    from app.services.patent_sources.normalizer import normalize_serpapi_record

    raw = {
        "title": "Novel Battery Storage Electrode",
        "patent_id": "US9999000",
    }
    record = normalize_serpapi_record(raw)
    assert record is not None
    assert record.title == "Novel Battery Storage Electrode"
    assert record.assignee == "Not available"
    assert record.filing_date is None
    assert record.filing_year is None
    # Detected from keyword 'Battery Storage' in title
    assert record.technology_domain == "Power Generation & Storage"
    assert record.patent_classification == "H01M"
    assert record.citation_count == 0


def test_serpapi_normalization_details_format():
    """Verify normalizing a SerpApi Google Patents details payload."""
    from app.services.patent_sources.normalizer import normalize_serpapi_record

    raw = {
        "title": "Computer Vision Object Detection System",
        "publication_number": "US10987654B1",
        "filing_date": "2022-03-20",
        "assignees": [{"name": "Microsoft Technology Licensing LLC"}],
        "inventors": [{"name": "John Doe"}],
        "classifications": [{"code": "G06T7/00"}, {"code": "G06V10/00"}],
        "cited_by": {
            "original": [
                {"title": "Citing patent 1"},
                {"title": "Citing patent 2"},
                {"title": "Citing patent 3"},
            ]
        },
    }
    record = normalize_serpapi_record(raw)
    assert record is not None
    assert record.patent_number == "US10987654B1"
    assert record.assignee == "Microsoft Technology Licensing LLC"
    assert record.assignee_normalized == "Microsoft Technology Licensing"
    assert record.patent_classification == "G06T7/00"
    assert record.technology_domain == "Computer Vision & Image Processing"
    assert record.citation_count == 3


def test_serpapi_client_unconfigured():
    """Verify SerpApi client returns empty list when unconfigured."""
    from app.services.patent_sources.serpapi_client import SerpApiGooglePatentsClient

    client_unconfigured = SerpApiGooglePatentsClient(api_key="")
    assert client_unconfigured.is_configured() is False
    assert client_unconfigured.search("test") == []
    assert client_unconfigured.get_details("patent/US1/en") is None


def test_serpapi_client_search_mocked(monkeypatch):
    """Test SerpApi search execution with mocked HTTP response."""
    import httpx
    from app.services.patent_sources.serpapi_client import SerpApiGooglePatentsClient

    captured_params = {}

    def mock_get(self, url, params=None, **kwargs):
        captured_params.update(params or {})
        return httpx.Response(
            200,
            json={
                "organic_results": [
                    {
                        "patent_id": "patent/US12345/en",
                        "title": "Mocked Patent Search Result",
                        "assignee": "Innovator Corp",
                        "filing_date": "2023-01-01",
                        "classification": "G06N",
                    }
                ]
            },
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(httpx.Client, "get", mock_get)

    client_instance = SerpApiGooglePatentsClient(api_key="mock_key_123")
    results = client_instance.search("deep learning", page=1, per_page=10)

    assert len(results) == 1
    assert results[0]["title"] == "Mocked Patent Search Result"
    assert captured_params.get("engine") == "google_patents"
    assert captured_params.get("q") == "deep learning"
    assert captured_params.get("num") == 10
    assert captured_params.get("api_key") == "mock_key_123"


def test_serpapi_client_details_mocked(monkeypatch):
    """Test SerpApi detail extraction with mocked HTTP response."""
    import httpx
    from app.services.patent_sources.serpapi_client import SerpApiGooglePatentsClient

    captured_params = {}

    def mock_get(self, url, params=None, **kwargs):
        captured_params.update(params or {})
        return httpx.Response(
            200,
            json={
                "patent_id": "patent/US5721827A/en",
                "title": "Detailed Patent Specification",
                "abstract": "An improved network routing protocol.",
            },
            request=httpx.Request("GET", url),
        )

    monkeypatch.setattr(httpx.Client, "get", mock_get)

    client_instance = SerpApiGooglePatentsClient(api_key="mock_key_123")
    details = client_instance.get_details("US5721827A")

    assert details is not None
    assert details["title"] == "Detailed Patent Specification"
    assert captured_params.get("engine") == "google_patents_details"
    assert captured_params.get("patent_id") == "patent/US5721827A/en"

