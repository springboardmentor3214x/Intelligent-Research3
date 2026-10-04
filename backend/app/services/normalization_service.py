"""
Normalization Service – Module 6 Technology Intelligence & Module 7 Innovation Scoring

Normalizes raw metric values (papers, patents, orgs, applications)
to 0–100 scores for use in the weighted maturity and innovation calculations.
"""
from __future__ import annotations
from typing import List, Optional


def normalize_value(
    value: float | int | None,
    min_val: float,
    max_val: float,
) -> Optional[float]:
    """
    Normalize a single value to 0–100 using min-max scaling.
    Returns None if value is None.
    Returns 50.0 if min_val == max_val (uniform dataset).
    """
    if value is None:
        return None
    if max_val == min_val:
        return 50.0
    normalized = ((value - min_val) / (max_val - min_val)) * 100.0
    return round(max(0.0, min(100.0, normalized)), 2)


def normalize_growth(
    growth: float | None,
    min_growth: float,
    max_growth: float,
) -> Optional[float]:
    """
    Normalize an average growth rate to 0–100.
    Handles negative growth (Declining technologies can have negative avg growth).
    """
    return normalize_value(growth, min_growth, max_growth)


def build_normalization_context(technologies_data: list[dict]) -> dict:
    """
    Given a list of technology data dicts with raw aggregate metrics,
    compute the min/max for each indicator across the full dataset.

    Each dict should have keys:
        total_research, total_patents, total_orgs, total_apps,
        avg_research_growth, avg_patent_growth

    Returns a context dict used by normalize_technology().
    """
    def safe_list(key):
        return [d[key] for d in technologies_data if d.get(key) is not None]

    research_vals = safe_list("total_research")
    patent_vals = safe_list("total_patents")
    org_vals = safe_list("total_orgs")
    app_vals = safe_list("total_apps")
    research_growth_vals = safe_list("avg_research_growth")
    patent_growth_vals = safe_list("avg_patent_growth")

    def _range(vals):
        if not vals:
            return (0.0, 100.0)
        return (min(vals), max(vals))

    return {
        "research_activity": _range(research_vals),
        "patent_activity": _range(patent_vals),
        "organization": _range(org_vals),
        "diversity": _range(app_vals),
        "research_growth": _range(research_growth_vals),
        "patent_growth": _range(patent_growth_vals),
    }


def normalize_technology(
    tech_data: dict,
    context: dict,
) -> dict:
    """
    Apply normalization to one technology's raw indicators using
    the context (min/max) built from the full dataset.

    Returns dict with keys matching the six maturity indicators.
    """
    def _norm(value, ctx_key):
        lo, hi = context[ctx_key]
        return normalize_value(value, lo, hi)

    return {
        "research_activity_score": _norm(tech_data.get("total_research"), "research_activity"),
        "patent_activity_score": _norm(tech_data.get("total_patents"), "patent_activity"),
        "organization_score": _norm(tech_data.get("total_orgs"), "organization"),
        "diversity_score": _norm(tech_data.get("total_apps"), "diversity"),
        "research_growth_score": _norm(tech_data.get("avg_research_growth"), "research_growth"),
        "patent_growth_score": _norm(tech_data.get("avg_patent_growth"), "patent_growth"),
    }


# ── Module 7 Normalization Helpers (Member 3 / Gopi) ───────────────────────────

def percentile_score(value: float, reference_values: List[float]) -> Optional[float]:
    """
    Returns what percentage of `reference_values` this value is >= to.
    Example: percentile_score(800, [10, 50, 200, 800, 2000]) -> 60.0
    """
    if not reference_values:
        return None
    count = sum(1 for v in reference_values if v <= value)
    return (count / len(reference_values)) * 100.0


def min_max_score(value: float, min_value: float, max_value: float) -> float:
    """
    Simple linear scaling into 0-100 given a known/documented reference range.
    """
    if max_value == min_value:
        return 50.0  # can't distinguish - stay neutral, don't fake precision
    normalized = (value - min_value) / (max_value - min_value) * 100.0
    return max(0.0, min(100.0, normalized))
