"""
Unit & Integration Tests for Module 6 – Technology Intelligence
Tests:
1. Normalization service (min-max scaling & bounds)
2. Trend service (CAGR, directional slope, and acceleration)
3. Maturity service (6 weighted indicators and stage classification)
4. Adoption service (separate from maturity scoring)
5. Opportunity service (opportunity signal detection)
"""
import pytest
from app.services.normalization_service import normalize_value
from app.services.trend_service import (
    growth_rate,
    calculate_trend,
    linear_slope,
)
from app.services.maturity_service import (
    classify_stage,
    compute_maturity_score,
    WEIGHTS,
)
from app.services.adoption_service import analyse_adoption
from app.services.opportunity_service import detect_opportunities


def test_normalization():
    # Value within range (0-100 scale)
    assert normalize_value(50, 0, 100) == 50.0
    # Value at min
    assert normalize_value(0, 0, 100) == 0.0
    # Value at max
    assert normalize_value(100, 0, 100) == 100.0
    # Clamping below min
    assert normalize_value(-10, 0, 100) == 0.0
    # Clamping above max
    assert normalize_value(150, 0, 100) == 100.0
    # Uniform dataset safeguard
    assert normalize_value(50, 50, 50) == 50.0


def test_growth_and_slope():
    # Growth rate: 100 -> 150 = +50%
    g = growth_rate(150, 100)
    assert g == 50.0

    # Zero base safeguard
    assert growth_rate(50, 0) is None

    # Positive linear slope
    slope = linear_slope([10, 20, 30, 40])
    assert slope == 10.0


def test_trend_calculation():
    years = [2021, 2022, 2023, 2024]
    research = [100, 130, 180, 260]
    patents = [10, 15, 25, 40]
    orgs = [5, 8, 12, 18]
    apps = [2, 3, 4, 6]

    trend = calculate_trend(research, patents, orgs, apps, years)
    assert trend["research_direction"] == "Increasing"
    assert trend["patent_direction"] == "Increasing"
    assert trend["research_growth"] > 25.0
    assert trend["patent_growth"] > 40.0
    assert trend["confidence"] > 0.7


def test_maturity_scoring_and_classification():
    # Check weights sum to 1.0
    total_weight = sum(WEIGHTS.values())
    assert abs(total_weight - 1.0) < 1e-6

    # Test stage classification with multi-factor inputs
    assert classify_stage(20.0, "Increasing", "Increasing", "Stable", "Stable", 4, 0.4, 0.3) == "Emerging"
    assert classify_stage(55.0, "Increasing", "Increasing", "Increasing", "Increasing", 5, 0.3, 0.25) == "Developing"
    assert classify_stage(80.0, "Stable", "Stable", "Stable", "Stable", 6, 0.05, 0.02) == "Mature"
    assert classify_stage(45.0, "Decreasing", "Decreasing", "Decreasing", "Decreasing", 5, -0.2, -0.15) == "Declining"

    # Perfect scores (0-100 normalized inputs)
    indicators = {
        "research_growth_score": 100.0,
        "patent_growth_score": 100.0,
        "research_activity_score": 100.0,
        "patent_activity_score": 100.0,
        "organization_score": 100.0,
        "diversity_score": 100.0,
    }
    score = compute_maturity_score(indicators)
    assert round(score, 1) == 100.0


def test_separate_adoption_analysis():
    # Technology with increasing adoption metrics
    years = [2022, 2023, 2024]
    adoption_rates = [10.0, 25.0, 45.0]
    adoption = analyse_adoption(adoption_rates, years)
    assert adoption["trend"] == "Increasing"
    assert adoption["years_available"] == 3


def test_opportunity_detection():
    # Technology with high research activity but low adoption -> should trigger adoption gap
    years = [2022, 2023, 2024]
    research = [1000, 2000, 3500]
    patents = [100, 250, 500]
    orgs = [20, 40, 70]
    apps = [2, 3, 4]

    trend = calculate_trend(research, patents, orgs, apps, years)
    adoption = {"level": "Low", "trend": "Increasing"}
    indicators = {
        "research_growth_score": 85.0,
        "patent_growth_score": 88.0,
        "research_activity_score": 75.0,
        "patent_activity_score": 70.0,
        "organization_score": 65.0,
        "diversity_score": 50.0,
    }
    signals = detect_opportunities("tech-test", "Quantum Computing", trend, adoption, indicators)
    assert len(signals) > 0

    opp_types = [s["opportunity_type"] for s in signals]
    assert "Adoption Gap" in opp_types


if __name__ == "__main__":
    test_normalization()
    test_growth_and_slope()
    test_trend_calculation()
    test_maturity_scoring_and_classification()
    test_separate_adoption_analysis()
    test_opportunity_detection()
    print("All Module 6 Technology Intelligence unit tests passed successfully!")
