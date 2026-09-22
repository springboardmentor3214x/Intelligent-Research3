"""
app/services/normalization_service.py
--------------------------------------
Converts raw values into a 0-100 scale so different indicators (patent
counts, citation counts, similarity scores...) can be combined fairly.

Two methods:
- percentile_score: robust to outliers, used when comparing a technology
  against many other technologies in your database.
- min_max_score: simpler, used when you have a fixed, documented range.
"""

from typing import List, Optional


def percentile_score(value: float, reference_values: List[float]) -> Optional[float]:
    """
    Returns what percentage of `reference_values` this value is >= to.
    Example: percentile_score(800, [10, 50, 200, 800, 2000]) -> 60.0
    """
    if not reference_values:
        return None
    count = sum(1 for v in reference_values if v <= value)
    return (count / len(reference_values)) * 100


def min_max_score(value: float, min_value: float, max_value: float) -> float:
    """
    Simple linear scaling into 0-100 given a known/documented reference range.
    """
    if max_value == min_value:
        return 50.0  # can't distinguish - stay neutral, don't fake precision
    normalized = (value - min_value) / (max_value - min_value) * 100
    return max(0.0, min(100.0, normalized))
