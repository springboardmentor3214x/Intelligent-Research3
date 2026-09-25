"""
Maturity Service – Module 6 Technology Intelligence

Weights (maturity_v1):
    Research Growth         25%  — Is research activity increasing over time?
    Patent Growth           25%  — Is patent/IP activity increasing over time?
    Research Activity       15%  — What is the current scale of research activity?
    Patent Activity         15%  — What is the current scale of patent activity?
    Organization Part.      10%  — How many organizations are participating?
    Tech/App Diversity      10%  — How broad are the use cases/applications?
    TOTAL                  100%

IMPORTANT: Adoption is NOT one of these six indicators.
Adoption is analysed separately and displayed as a distinct signal.

Stage classification uses multiple factors:
    - Composite maturity score
    - Research trend direction
    - Patent trend direction
    - Historical scale context
    - Adoption is a supplementary contextual signal only
"""
from __future__ import annotations

from app.services.explanation_service import build_explanation

METHODOLOGY_VERSION = "maturity_v1"

# Weights — must sum to 1.0
WEIGHTS = {
    "research_growth": 0.25,
    "patent_growth": 0.25,
    "research_activity": 0.15,
    "patent_activity": 0.15,
    "organization": 0.10,
    "diversity": 0.10,
}

assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9, "Weights must sum to 1.0"


def compute_maturity_score(indicators: dict) -> float | None:
    """
    Compute the weighted maturity score (0–100).

    indicators keys (0-100 normalized scores):
        research_growth_score, patent_growth_score,
        research_activity_score, patent_activity_score,
        organization_score, diversity_score
    """
    mapping = {
        "research_growth": indicators.get("research_growth_score"),
        "patent_growth": indicators.get("patent_growth_score"),
        "research_activity": indicators.get("research_activity_score"),
        "patent_activity": indicators.get("patent_activity_score"),
        "organization": indicators.get("organization_score"),
        "diversity": indicators.get("diversity_score"),
    }

    weighted_sum = 0.0
    weight_used = 0.0

    for key, weight in WEIGHTS.items():
        val = mapping.get(key)
        if val is not None:
            weighted_sum += val * weight
            weight_used += weight

    if weight_used == 0:
        return None

    # Re-scale to 0–100 even if some indicators are missing
    return round((weighted_sum / weight_used) * 100 / 100, 2) if weight_used < 1.0 else round(weighted_sum, 2)


def classify_stage(
    score: float | None,
    research_direction: str | None,
    patent_direction: str | None,
    org_direction: str | None,
    app_direction: str | None,
    years_analysed: int | None,
    research_growth: float | None,
    patent_growth: float | None,
) -> str:
    """
    Evidence-based stage classification.

    Returns: "Emerging" | "Developing" | "Mature" | "Declining"

    Uses multiple factors — NOT a single score threshold.
    """
    if score is None:
        return "Emerging"

    n = years_analysed or 0
    r_up = research_direction == "Increasing"
    r_down = research_direction == "Decreasing"
    p_up = patent_direction == "Increasing"
    p_down = patent_direction == "Decreasing"
    r_stable = research_direction == "Stable"
    p_stable = patent_direction == "Stable"

    # ── Declining ───────────────────────────────────────────────────────────
    # Sustained decrease in both research and patent activity
    if r_down and p_down:
        return "Declining"

    # ── Emerging ─────────────────────────────────────────────────────────────
    # Low composite score + insufficient years or early growth signals
    if n < 3 or score < 30:
        return "Emerging"

    # Early-stage growth (score 30–55) with increasing signals
    if 30 <= score < 55 and (r_up or p_up):
        return "Emerging"

    # ── Mature ───────────────────────────────────────────────────────────────
    # High score + stable/slow growth = mature ecosystem
    if score >= 70 and (r_stable or p_stable) and not (r_down or p_down):
        return "Mature"

    # High score + strong org/app breadth even if growth is moderate
    if score >= 75:
        return "Mature"

    # ── Developing ───────────────────────────────────────────────────────────
    # Strong multi-year growth in research and/or patents
    if score >= 40 and (r_up or p_up):
        return "Developing"

    # Medium score with stable activity
    if 50 <= score < 70:
        return "Developing"

    # Default fallback
    if score >= 55:
        return "Developing"

    return "Emerging"


def analyse_maturity(
    technology_id: str,
    indicators: dict,
    trend: dict,
    adoption: dict,
    data_coverage: dict | None = None,
) -> dict:
    """
    Full maturity analysis for one technology.

    Parameters:
        technology_id: str
        indicators: normalized scores (0-100) for the six indicators
        trend: output from trend_service.calculate_trend()
        adoption: {"level": str, "trend": str}
        data_coverage: {"yearsAvailable": int, "adoptionYears": int, ...}

    Returns a dict matching MaturityOut schema.
    """
    score = compute_maturity_score(indicators)

    stage = classify_stage(
        score=score,
        research_direction=trend.get("research_direction"),
        patent_direction=trend.get("patent_direction"),
        org_direction=trend.get("organization_direction"),
        app_direction=trend.get("application_direction"),
        years_analysed=trend.get("years_analysed"),
        research_growth=trend.get("research_growth"),
        patent_growth=trend.get("patent_growth"),
    )

    explanation = build_explanation(
        stage=stage,
        research_direction=trend.get("research_direction"),
        patent_direction=trend.get("patent_direction"),
        org_direction=trend.get("organization_direction"),
        app_direction=trend.get("application_direction"),
        adoption_level=adoption.get("level"),
        adoption_trend=adoption.get("trend"),
        years_analysed=trend.get("years_analysed"),
        research_growth=trend.get("research_growth"),
        patent_growth=trend.get("patent_growth"),
        data_coverage=data_coverage,
    )

    return {
        "technology_id": technology_id,
        "stage": stage,
        "score": score,
        "indicators": {
            "researchGrowth": indicators.get("research_growth_score"),
            "patentGrowth": indicators.get("patent_growth_score"),
            "researchActivity": indicators.get("research_activity_score"),
            "patentActivity": indicators.get("patent_activity_score"),
            "organizationParticipation": indicators.get("organization_score"),
            "applicationDiversity": indicators.get("diversity_score"),
        },
        "weights": {
            "researchGrowth": WEIGHTS["research_growth"],
            "patentGrowth": WEIGHTS["patent_growth"],
            "researchActivity": WEIGHTS["research_activity"],
            "patentActivity": WEIGHTS["patent_activity"],
            "organizationParticipation": WEIGHTS["organization"],
            "applicationDiversity": WEIGHTS["diversity"],
        },
        "adoption": adoption,
        "confidence": trend.get("confidence"),
        "explanation": explanation,
        "methodology_version": METHODOLOGY_VERSION,
    }
