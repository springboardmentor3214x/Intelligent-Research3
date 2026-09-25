"""
Trend Service – Module 6 Technology Intelligence

Calculates year-over-year growth, trend direction, linear slope,
and confidence score for research and patent time-series data.

Rules:
- Requires >= 3 years for a meaningful trend (otherwise "Insufficient Data")
- Growth formula: ((current - previous) / previous) × 100
- Previous year = 0 → growth = None, reason = "zero_baseline"
- Direction thresholds (configurable):
    Increasing  : avg growth >= +10%
    Decreasing  : avg growth <= -10%
    Stable      : between -10% and +10%
"""
from __future__ import annotations

from typing import Optional

METHODOLOGY_VERSION = "maturity_v1"

# Threshold for classifying direction (percent)
INCREASING_THRESHOLD = 10.0
DECREASING_THRESHOLD = -10.0
MIN_YEARS_FOR_TREND = 3


def growth_rate(current: int | float, previous: int | float) -> Optional[float]:
    """
    Compute year-over-year growth rate.

    Returns None if previous == 0 (zero baseline — avoids Infinity).
    Returns None if either value is None.
    """
    if current is None or previous is None:
        return None
    if previous == 0:
        return None  # Caller should label this "zero_baseline"
    return ((current - previous) / previous) * 100.0


def yearly_growth_series(
    values: list[int | float | None],
    years: list[int],
) -> dict[str, dict]:
    """
    Given time-ordered values and corresponding years,
    return a dict keyed by year with growth rate and status.

    Example output:
        {
            "2022": {"value": 180, "growth": 80.0, "status": "ok"},
            "2023": {"value": 350, "growth": 94.4, "status": "ok"},
            "2024": {"value": 0,   "growth": None,  "status": "zero_baseline"},
        }
    """
    result = {}
    for i, (year, value) in enumerate(zip(years, values)):
        if i == 0:
            result[str(year)] = {"value": value, "growth": None, "status": "first_year"}
            continue
        prev = values[i - 1]
        if prev is None or value is None:
            result[str(year)] = {"value": value, "growth": None, "status": "missing_data"}
        elif prev == 0:
            result[str(year)] = {"value": value, "growth": None, "status": "zero_baseline"}
        else:
            g = growth_rate(value, prev)
            result[str(year)] = {"value": value, "growth": round(g, 2), "status": "ok"}
    return result


def average_growth(growth_series: dict) -> Optional[float]:
    """Average of all valid growth rates in the series."""
    valid = [
        v["growth"]
        for v in growth_series.values()
        if v.get("growth") is not None and v.get("status") == "ok"
    ]
    if not valid:
        return None
    return sum(valid) / len(valid)


def linear_slope(values: list[int | float | None]) -> Optional[float]:
    """
    Simple linear regression slope on the value series.
    Uses least-squares fit with x = [0, 1, 2, ...].
    Returns None if < 2 valid points.
    """
    clean = [(i, v) for i, v in enumerate(values) if v is not None]
    n = len(clean)
    if n < 2:
        return None
    xs = [p[0] for p in clean]
    ys = [p[1] for p in clean]
    x_mean = sum(xs) / n
    y_mean = sum(ys) / n
    num = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))
    den = sum((x - x_mean) ** 2 for x in xs)
    if den == 0:
        return 0.0
    return num / den


def determine_direction(values: list[int | float | None], years: list[int]) -> str:
    """
    Classify time-series direction.

    Returns one of:
        "Increasing" | "Stable" | "Decreasing" | "Insufficient Data"
    """
    valid_values = [v for v in values if v is not None]
    if len(valid_values) < MIN_YEARS_FOR_TREND:
        return "Insufficient Data"

    series = yearly_growth_series(values, years)
    avg = average_growth(series)
    if avg is None:
        # Fall back to slope sign
        slope = linear_slope(values)
        if slope is None:
            return "Insufficient Data"
        if slope > 0:
            return "Increasing"
        if slope < 0:
            return "Decreasing"
        return "Stable"

    if avg >= INCREASING_THRESHOLD:
        return "Increasing"
    if avg <= DECREASING_THRESHOLD:
        return "Decreasing"
    return "Stable"


def calculate_trend(
    research_values: list[int | None],
    patent_values: list[int | None],
    org_values: list[int | None],
    app_values: list[int | None],
    years: list[int],
) -> dict:
    """
    Master trend calculation function.
    Returns a dict ready to persist into TechnologyTrend.
    """
    n_years = len(years)

    research_series = yearly_growth_series(research_values, years)
    patent_series = yearly_growth_series(patent_values, years)

    avg_research_growth = average_growth(research_series)
    avg_patent_growth = average_growth(patent_series)

    research_direction = determine_direction(research_values, years)
    patent_direction = determine_direction(patent_values, years)
    org_direction = determine_direction(org_values, years)
    app_direction = determine_direction(app_values, years)

    research_slope = linear_slope(research_values)
    patent_slope = linear_slope(patent_values)

    # Confidence: based on years available and data completeness
    data_completeness = sum(
        1 for v in research_values + patent_values + org_values + app_values
        if v is not None
    ) / max(len(research_values + patent_values + org_values + app_values), 1)

    year_factor = min(n_years / 5.0, 1.0)  # 5 years = full credit
    confidence = round(data_completeness * year_factor, 3)

    return {
        "research_growth": round(avg_research_growth, 2) if avg_research_growth is not None else None,
        "patent_growth": round(avg_patent_growth, 2) if avg_patent_growth is not None else None,
        "research_direction": research_direction,
        "patent_direction": patent_direction,
        "organization_direction": org_direction,
        "application_direction": app_direction,
        "research_slope": round(research_slope, 4) if research_slope is not None else None,
        "patent_slope": round(patent_slope, 4) if patent_slope is not None else None,
        "confidence": confidence,
        "years_analysed": n_years,
        "yearly_research_growth": research_series,
        "yearly_patent_growth": patent_series,
    }
