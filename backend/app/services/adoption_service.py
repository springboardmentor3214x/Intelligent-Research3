"""
Adoption Service – Module 6 Technology Intelligence

IMPORTANT: Adoption is analysed SEPARATELY from the six maturity indicators.
A technology can have high research/patent growth but low adoption.
This must be clearly visible in the dashboard.

Adoption level is classified from adoption_rate values across years.
Adoption trend uses the same direction logic as trend_service.
"""
from __future__ import annotations
from app.services.trend_service import determine_direction, average_growth, yearly_growth_series

# Adoption level thresholds (percentile-based, relative to dataset)
LOW_THRESHOLD = 30.0
HIGH_THRESHOLD = 70.0


def classify_adoption_level(
    adoption_values: list[float | None],
    min_val: float = 0.0,
    max_val: float = 100.0,
) -> str:
    """
    Classify current adoption level.

    Returns: "Low" | "Medium" | "High" | "Insufficient Data"

    Uses the most recent valid value as the current adoption indicator.
    """
    valid = [v for v in adoption_values if v is not None]
    if not valid:
        return "Insufficient Data"

    current = valid[-1]  # Most recent year

    # Normalize to 0–100 if values are raw counts
    if max_val > 0 and max_val != min_val:
        normalized = ((current - min_val) / (max_val - min_val)) * 100
    else:
        normalized = current

    if normalized < LOW_THRESHOLD:
        return "Low"
    if normalized >= HIGH_THRESHOLD:
        return "High"
    return "Medium"


def analyse_adoption(
    adoption_values: list[float | None],
    years: list[int],
) -> dict:
    """
    Analyse adoption trend and level.

    Returns:
        {
            "level": str,
            "trend": str,
            "yearly_values": dict,
            "current_value": float | None,
            "years_available": int,
        }
    """
    valid = [v for v in adoption_values if v is not None]
    n_valid = len(valid)

    # Classify level
    min_val = min(valid) if valid else 0.0
    max_val = max(valid) if valid else 0.0
    level = classify_adoption_level(adoption_values, min_val, max_val)

    # Trend direction
    trend_direction = determine_direction(adoption_values, years)

    # Yearly series
    yearly = yearly_growth_series(adoption_values, years)

    return {
        "level": level,
        "trend": trend_direction,
        "yearly_values": yearly,
        "current_value": valid[-1] if valid else None,
        "years_available": n_valid,
    }
