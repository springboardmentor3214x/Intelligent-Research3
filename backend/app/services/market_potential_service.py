"""
backend/app/services/market_potential_service.py
Author: Member 4 (Module 7: Market Potential Factor - 20%)

Logic according to Module 6 & 7 Implementation Guide (Section 8.B & Section 10):
Formulas and indicator weights for Market Potential (20% of Innovation Score):
- applicationBreadth: 25%
- industryRelevance: 20%
- demandSignals: 20%
- organizationBreadth: 15%
- applicationGrowth: 20%
"""

from typing import Dict, Any, Optional
from app.schemas.module7_member4 import MarketPotentialInput, MarketPotentialResponse

MARKET_POTENTIAL_WEIGHTS = {
    "applicationBreadth": 0.25,
    "industryRelevance": 0.20,
    "demandSignals": 0.20,
    "organizationBreadth": 0.15,
    "applicationGrowth": 0.20,
}

FACTOR_WEIGHT = 0.20  # 20% overall Module 7 weight


def calculate_market_potential_score(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates the 0-100 Market Potential factor score.
    Handles missing values using adjusted weights policy (PDF Section 10).
    """
    available_weights = {}
    available_values = {}

    for key, default_weight in MARKET_POTENTIAL_WEIGHTS.items():
        val = data.get(key)
        if val is not None and isinstance(val, (int, float)) and 0.0 <= val <= 100.0:
            available_weights[key] = default_weight
            available_values[key] = float(val)

    if not available_values:
        # Fallback if no indicators available
        score = 0.0
        status = "insufficient_data"
    else:
        total_weight = sum(available_weights.values())
        raw_score = sum((available_values[k] * (available_weights[k] / total_weight)) for k in available_values)
        score = round(raw_score, 2)
        status = "complete" if len(available_values) == len(MARKET_POTENTIAL_WEIGHTS) else "calculated_with_adjusted_weights"

    weighted_contribution = round(score * FACTOR_WEIGHT, 2)

    return {
        "score": score,
        "status": status,
        "factor_weight": FACTOR_WEIGHT,
        "weighted_contribution": weighted_contribution,
        "indicators": {k: available_values.get(k, 0.0) for k in MARKET_POTENTIAL_WEIGHTS}
    }


def get_market_potential_for_technology(technology_id: str, custom_inputs: Optional[MarketPotentialInput] = None) -> MarketPotentialResponse:
    """
    Fetches market potential indicators for a given technology ID (or processes custom input)
    and returns a structured MarketPotentialResponse schema.
    """
    if custom_inputs:
        input_dict = custom_inputs.model_dump()
    else:
        # Default baseline indicators for technology lookup (e.g. from DB / Module 6 proxies)
        input_dict = {
            "applicationBreadth": 75.0,
            "industryRelevance": 80.0,
            "demandSignals": 70.0,
            "organizationBreadth": 65.0,
            "applicationGrowth": 85.0
        }

    res = calculate_market_potential_score(input_dict)
    
    return MarketPotentialResponse(
        technology_id=technology_id,
        score=res["score"],
        factor_weight=res["factor_weight"],
        weighted_contribution=res["weighted_contribution"],
        indicators=res["indicators"]
    )
