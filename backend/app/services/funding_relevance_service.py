"""
backend/app/services/funding_relevance_service.py
Author: Member 4 (Module 7: Funding Relevance Factor - 15%)

Logic according to Module 6 & 7 Implementation Guide (Section 8.C & Section 10):
Connects Module 7 to Module 4 funding opportunities.
Formulas and indicator weights for Funding Relevance (15% of Innovation Score):
- opportunityCount: 25% (number of active/relevant funding grants)
- relevance: 30% (keyword/topic alignment)
- eligibilityMatch: 25% (eligibility match for target applicants)
- programActivity: 20% (funder activity level)
"""

from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.funding import FundingOpportunity
from app.schemas.module7_member4 import FundingRelevanceInput, FundingRelevanceResponse

FUNDING_RELEVANCE_WEIGHTS = {
    "opportunityCount": 0.25,
    "relevance": 0.30,
    "eligibilityMatch": 0.25,
    "programActivity": 0.20,
}

FACTOR_WEIGHT = 0.15  # 15% overall Module 7 weight


def calculate_funding_relevance_score(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates the 0-100 Funding Relevance factor score.
    Handles missing values using adjusted weights policy (PDF Section 10).
    """
    available_weights = {}
    available_values = {}

    for key, default_weight in FUNDING_RELEVANCE_WEIGHTS.items():
        val = data.get(key)
        if val is not None and isinstance(val, (int, float)) and 0.0 <= val <= 100.0:
            available_weights[key] = default_weight
            available_values[key] = float(val)

    if not available_values:
        score = 0.0
        status = "insufficient_data"
    else:
        total_weight = sum(available_weights.values())
        raw_score = sum((available_values[k] * (available_weights[k] / total_weight)) for k in available_values)
        score = round(raw_score, 2)
        status = "complete" if len(available_values) == len(FUNDING_RELEVANCE_WEIGHTS) else "calculated_with_adjusted_weights"

    weighted_contribution = round(score * FACTOR_WEIGHT, 2)

    return {
        "score": score,
        "status": status,
        "factor_weight": FACTOR_WEIGHT,
        "weighted_contribution": weighted_contribution,
        "indicators": {k: available_values.get(k, 0.0) for k in FUNDING_RELEVANCE_WEIGHTS}
    }


def get_funding_relevance_for_technology(
    technology_id: str, 
    db: Optional[Session] = None, 
    custom_inputs: Optional[FundingRelevanceInput] = None
) -> FundingRelevanceResponse:
    """
    Retrieves funding relevance metrics by inspecting Module 4 funding opportunities in DB
    (or using custom/mock inputs) and returns FundingRelevanceResponse schema.
    """
    real_opp_count = 0
    
    if db:
        try:
            # Query Module 4 DB to see how many active funding opportunities exist
            count_in_db = db.query(FundingOpportunity).filter(FundingOpportunity.status == "active").count()
            if count_in_db > 0:
                real_opp_count = count_in_db
        except Exception:
            real_opp_count = 0

    if custom_inputs:
        input_dict = custom_inputs.model_dump()
    else:
        # Scale DB count into a 0-100 indicator (e.g. 20+ opportunities = 100 score)
        opp_count_indicator = min(100.0, float(real_opp_count * 5.0)) if real_opp_count > 0 else 70.0
        input_dict = {
            "opportunityCount": opp_count_indicator,
            "relevance": 80.0,
            "eligibilityMatch": 75.0,
            "programActivity": 65.0
        }

    res = calculate_funding_relevance_score(input_dict)

    return FundingRelevanceResponse(
        technology_id=technology_id,
        score=res["score"],
        factor_weight=res["factor_weight"],
        weighted_contribution=res["weighted_contribution"],
        indicators=res["indicators"],
        relevant_opportunities_count=real_opp_count
    )
