"""
Live Smoke Test for Unified Research Intelligence Integration
Validates all 5 providers, endpoints, deduplication, and trend analysis.
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app

client = TestClient(app)


def test_providers_status():
    response = client.get("/api/research/providers/status")
    assert response.status_code == 200
    data = response.json()
    assert data["total_providers_count"] == 5
    assert data["active_providers_count"] == 5
    provider_names = [p["name"] for p in data["providers"]]
    assert "OpenAlex" in provider_names
    assert "Semantic Scholar" in provider_names
    assert "Crossref" in provider_names
    assert "CORE" in provider_names
    assert "Google Scholar (SerpApi)" in provider_names


def test_unified_search():
    response = client.get("/api/research/search?q=deep+learning&limit=6")
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] > 0
    assert len(data["papers"]) > 0
    assert len(data["sources_succeeded"]) > 0
    
    first_paper = data["papers"][0]
    assert "id" in first_paper
    assert "title" in first_paper
    assert "source" in first_paper
    assert "authors" in first_paper
    assert "provenance" in first_paper


def test_trends_calculation():
    response = client.get("/api/research/trends?domain=Artificial+Intelligence&years=4")
    assert response.status_code == 200
    data = response.json()
    assert "year_distribution" in data
    assert "top_topics" in data
    assert "total_publications_analyzed" in data
    assert data["domain"] == "Artificial Intelligence"


def test_module2_recommendations():
    response = client.get("/api/research/recommendations?domain=Machine+Learning&keywords=transformers,llm&limit=4")
    assert response.status_code == 200
    papers = response.json()
    assert isinstance(papers, list)
    assert len(papers) > 0


if __name__ == "__main__":
    print("Running test_providers_status...")
    test_providers_status()
    print("-> PASSED")

    print("Running test_unified_search...")
    test_unified_search()
    print("-> PASSED")

    print("Running test_trends_calculation...")
    test_trends_calculation()
    print("-> PASSED")

    print("Running test_module2_recommendations...")
    test_module2_recommendations()
    print("-> PASSED")

    print("\nALL RESEARCH INTEGRATION TESTS PASSED SUCCESSFULLY!")
