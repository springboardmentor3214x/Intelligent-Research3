"""
backend/tests/test_module7_member4.py
Unit and Integration tests for Module 7 - Member 4 responsibilities:
- Technology Maturity (15% factor)
- Market Potential (20% factor)
- Funding Relevance (15% factor)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.market_potential_service import calculate_market_potential_score
from app.services.funding_relevance_service import calculate_funding_relevance_score
from app.services.technology_maturity_service import get_technology_maturity

client = TestClient(app)


def test_market_potential_formula():
    """Verify Market Potential score formula: appBreadth(25%) + indRel(20%) + demand(20%) + orgBreadth(15%) + appGrowth(20%)."""
    input_data = {
        "applicationBreadth": 80.0,
        "industryRelevance": 70.0,
        "demandSignals": 90.0,
        "organizationBreadth": 60.0,
        "applicationGrowth": 100.0,
    }
    # Expected: (80*0.25) + (70*0.20) + (90*0.20) + (60*0.15) + (100*0.20)
    # = 20.0 + 14.0 + 18.0 + 9.0 + 20.0 = 81.0
    result = calculate_market_potential_score(input_data)
    assert result["score"] == 81.0
    assert result["factor_weight"] == 0.20
    assert result["weighted_contribution"] == 16.2  # 81.0 * 0.20
    assert result["status"] == "complete"


def test_market_potential_missing_data_handling():
    """Verify missing data handling (adjusted weights) as per PDF Section 10."""
    input_data = {
        "applicationBreadth": 80.0,
        "industryRelevance": 70.0,
        # demandSignals missing
        # organizationBreadth missing
        "applicationGrowth": 100.0,
    }
    result = calculate_market_potential_score(input_data)
    # Available weights: 0.25 + 0.20 + 0.20 = 0.65
    # Adjusted score = (80*0.25/0.65) + (70*0.20/0.65) + (100*0.20/0.65) = 83.08
    assert result["status"] == "calculated_with_adjusted_weights"
    assert result["score"] > 0.0


def test_funding_relevance_formula():
    """Verify Funding Relevance score formula: oppCount(25%) + relevance(30%) + eligMatch(25%) + progAct(20%)."""
    input_data = {
        "opportunityCount": 100.0,
        "relevance": 80.0,
        "eligibilityMatch": 60.0,
        "programActivity": 90.0,
    }
    # Expected: (100*0.25) + (80*0.30) + (60*0.25) + (90*0.20)
    # = 25.0 + 24.0 + 15.0 + 18.0 = 82.0
    result = calculate_funding_relevance_score(input_data)
    assert result["score"] == 82.0
    assert result["factor_weight"] == 0.15
    assert result["weighted_contribution"] == 12.3  # 82.0 * 0.15
    assert result["status"] == "complete"


def test_technology_maturity_service():
    """Verify Technology Maturity service returns expected stage, score, and weight."""
    result = get_technology_maturity("TECH_AI_01")
    assert result.technology_id == "TECH_AI_01"
    assert result.stage in ["Emerging", "Developing", "Mature", "Declining"]
    assert result.factor_weight == 0.15
    assert result.weighted_contribution == round(result.score * 0.15, 2)


# ── FastAPI Endpoint Tests ──────────────────────────────────────────────────

def test_api_technology_maturity():
    """Test GET /api/technologies/{technology_id}/maturity endpoint (PDF required Member 4 API)."""
    response = client.get("/api/technologies/TECH001/maturity")
    assert response.status_code == 200
    data = response.json()
    assert data["technology_id"] == "TECH001"
    assert "stage" in data
    assert "score" in data
    assert data["factor_weight"] == 0.15


def test_api_relevant_funding():
    """Test GET /api/funding/relevant/{technology_id} endpoint (PDF required Member 4 API)."""
    response = client.get("/api/funding/relevant/TECH001")
    assert response.status_code == 200
    data = response.json()
    assert data["technology_id"] == "TECH001"
    assert "score" in data
    assert data["factor_weight"] == 0.15


def test_api_market_potential():
    """Test POST /api/innovation/market-potential calculation endpoint."""
    payload = {
        "applicationBreadth": 75.0,
        "industryRelevance": 85.0,
        "demandSignals": 65.0,
        "organizationBreadth": 90.0,
        "applicationGrowth": 80.0,
    }
    response = client.post("/api/innovation/market-potential?technology_id=TECH001", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["technology_id"] == "TECH001"
    assert data["factor_weight"] == 0.20
    assert data["score"] > 0.0


def test_api_member4_factors_summary():
    """Test GET /api/innovation/member4-factors/{technology_id} summary endpoint."""
    response = client.get("/api/innovation/member4-factors/TECH001")
    assert response.status_code == 200
    data = response.json()
    assert data["technology_id"] == "TECH001"
    assert "technology_maturity" in data
    assert "market_potential" in data
    assert "funding_relevance" in data
    # Check that member4 factors combine to 50% max total contribution
    total_contrib = (
        data["technology_maturity"]["weighted_contribution"]
        + data["market_potential"]["weighted_contribution"]
        + data["funding_relevance"]["weighted_contribution"]
    )
    assert round(data["combined_member4_weighted_score"], 2) == round(total_contrib, 2)
