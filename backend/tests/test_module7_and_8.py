"""
backend/tests/test_module7_and_8.py
Comprehensive Unit & Integration Tests for:
- MODULE 7: INNOVATION SCORING ENGINE
- MODULE 8: COMMERCIALIZATION RECOMMENDATION ENGINE
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.innovation_scoring_service import (
    calculate_deterministic_innovation_score,
    OFFICIAL_WEIGHTS,
)
from app.services.commercialization_service import (
    calculate_commercialization_readiness,
)
from app.services.normalization_service import min_max_score

client = TestClient(app)


# ═════════════════════════════════════════════════════════════════════════════
# MODULE 7 UNIT TESTS
# ═════════════════════════════════════════════════════════════════════════════

def test_module7_official_weights():
    """Verify that official weights sum to exactly 1.00 (100%)."""
    assert OFFICIAL_WEIGHTS["research_novelty"] == 0.30
    assert OFFICIAL_WEIGHTS["patent_strength"] == 0.20
    assert OFFICIAL_WEIGHTS["technology_maturity"] == 0.15
    assert OFFICIAL_WEIGHTS["market_potential"] == 0.20
    assert OFFICIAL_WEIGHTS["funding_relevance"] == 0.15
    assert round(sum(OFFICIAL_WEIGHTS.values()), 4) == 1.0


def test_module7_prompt_example_calculation():
    """
    Test exact formula example from Master Prompt:
    Research Novelty = 80
    Patent Strength = 70
    Technology Maturity = 60
    Market Potential = 75
    Funding Relevance = 65

    Expected:
    80 * 0.30 + 70 * 0.20 + 60 * 0.15 + 75 * 0.20 + 65 * 0.15
    = 24.0 + 14.0 + 9.0 + 15.0 + 9.75 = 71.75 / 100
    """
    res = calculate_deterministic_innovation_score(
        research_novelty=80.0,
        patent_strength=70.0,
        technology_maturity=60.0,
        market_potential=75.0,
        funding_relevance=65.0,
    )
    assert res["overall_score"] == 71.75
    assert res["status"] == "complete"
    assert res["data_completeness"] == 100.0
    assert res["missing_factors"] == []
    assert res["contributions"]["research_novelty"] == 24.0
    assert res["contributions"]["patent_strength"] == 14.0
    assert res["contributions"]["technology_maturity"] == 9.0
    assert res["contributions"]["market_potential"] == 15.0
    assert res["contributions"]["funding_relevance"] == 9.75


def test_module7_missing_data_adjusted_weights():
    """
    Verify missing data handling (adjusted weights policy):
    If Funding Relevance is missing:
    Available weights = 0.30 + 0.20 + 0.15 + 0.20 = 0.85
    """
    res = calculate_deterministic_innovation_score(
        research_novelty=80.0,
        patent_strength=70.0,
        technology_maturity=60.0,
        market_potential=75.0,
        funding_relevance=None,
    )
    assert res["status"] == "calculated_with_adjusted_weights"
    assert res["data_completeness"] == 80.0
    assert "funding_relevance" in res["missing_factors"]
    # (80*0.30 + 70*0.20 + 60*0.15 + 75*0.20) / 0.85 = (24 + 14 + 9 + 15) / 0.85 = 62 / 0.85 = 72.94
    assert res["overall_score"] == 72.94


def test_module7_insufficient_data():
    """Verify that fewer than 3 available factors returns insufficient_data."""
    res = calculate_deterministic_innovation_score(
        research_novelty=80.0,
        patent_strength=70.0,
        technology_maturity=None,
        market_potential=None,
        funding_relevance=None,
    )
    assert res["overall_score"] is None
    assert res["status"] == "insufficient_data"
    assert res["data_completeness"] == 40.0
    assert len(res["missing_factors"]) == 3


def test_normalization_min_max():
    """Verify normalization utility bounds values cleanly between 0 and 100."""
    assert min_max_score(50, 0, 100) == 50.0
    assert min_max_score(150, 0, 100) == 100.0
    assert min_max_score(-10, 0, 100) == 0.0
    assert min_max_score(5, 5, 5) == 50.0  # Equal min/max fallback


# ═════════════════════════════════════════════════════════════════════════════
# MODULE 8 UNIT TESTS
# ═════════════════════════════════════════════════════════════════════════════

def test_module8_commercialization_readiness():
    """
    Verify Commercialization Readiness is distinct and bounded 0-100:
    readiness = maturity*0.30 + market*0.25 + patent*0.20 + adoption*0.15 + funding*0.10
    """
    readiness = calculate_commercialization_readiness(
        technology_maturity=60.0,
        market_potential=75.0,
        patent_strength=70.0,
        adoption_rate_score=50.0,
        funding_relevance=65.0,
    )
    # Expected: (60*0.30) + (75*0.25) + (70*0.20) + (50*0.15) + (65*0.10)
    # = 18.0 + 18.75 + 14.0 + 7.5 + 6.5 = 64.75
    assert readiness == 64.75


# ═════════════════════════════════════════════════════════════════════════════
# API INTEGRATION TESTS
# ═════════════════════════════════════════════════════════════════════════════

def test_api_innovation_score_calculate():
    """Test POST /api/innovation-score/calculate endpoint."""
    response = client.post("/api/innovation-score/calculate", json={"technology_id": "TECH_TEST_01"})
    assert response.status_code == 200
    data = response.json()
    assert data["technology_id"] == "TECH_TEST_01"
    assert data["overall_score"] is not None
    assert 0.0 <= data["overall_score"] <= 100.0
    assert "factors" in data
    assert "research_novelty" in data["factors"]
    assert "patent_strength" in data["factors"]
    assert "technology_maturity" in data["factors"]
    assert "market_potential" in data["factors"]
    assert "funding_relevance" in data["factors"]
    assert "evidence" in data
    assert data["data_completeness"] > 0


def test_api_innovation_score_get_and_breakdown():
    """Test GET /api/innovation-score/{tech_id} and breakdown."""
    response = client.get("/api/innovation-score/TECH_TEST_01")
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "factors" in data

    breakdown_res = client.get("/api/innovation-score/TECH_TEST_01/breakdown")
    assert breakdown_res.status_code == 200
    bd = breakdown_res.json()
    assert "factors" in bd
    assert "research_novelty" in bd["factors"]


def test_api_commercialization_analysis():
    """Test GET /api/commercialization/{tech_id} complete analysis."""
    response = client.get("/api/commercialization/TECH_TEST_01")
    assert response.status_code == 200
    data = response.json()
    assert data["technologyId"] == "TECH_TEST_01"
    assert "innovationScore" in data
    assert "commercializationReadiness" in data
    assert "pathways" in data

    pathways = data["pathways"]
    assert "productization" in pathways
    assert "licensing" in pathways
    assert "startup" in pathways
    assert "industryPartnership" in pathways

    # Check scores in range
    assert 0 <= pathways["productization"]["score"] <= 100
    assert 0 <= pathways["licensing"]["score"] <= 100
    assert 0 <= pathways["startup"]["score"] <= 100
    assert 0 <= pathways["industryPartnership"]["score"] <= 100

    # Check gaps, risks, and roadmap
    assert "commercializationGaps" in data
    assert "risks" in data
    assert "roadmap" in data
    assert len(data["roadmap"]) == 4  # 4 phases


def test_api_commercialization_pathway_endpoints():
    """Test specific sub-endpoints of commercialization."""
    prod_res = client.get("/api/commercialization/TECH_TEST_01/productization")
    assert prod_res.status_code == 200
    assert "productization" in prod_res.json()

    lic_res = client.get("/api/commercialization/TECH_TEST_01/licensing")
    assert lic_res.status_code == 200
    assert "licensing" in lic_res.json()

    startup_res = client.get("/api/commercialization/TECH_TEST_01/startup")
    assert startup_res.status_code == 200
    assert "startup" in startup_res.json()

    part_res = client.get("/api/commercialization/TECH_TEST_01/industry-partnership")
    assert part_res.status_code == 200
    assert "industryPartnership" in part_res.json()

    roadmap_res = client.get("/api/commercialization/TECH_TEST_01/roadmap")
    assert roadmap_res.status_code == 200
    assert len(roadmap_res.json()["roadmap"]) == 4
