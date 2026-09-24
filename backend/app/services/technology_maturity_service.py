"""
backend/app/services/technology_maturity_service.py
Author: Member 4 (Module 7: Technology Maturity Factor - 15%)

Logic according to Module 6 & 7 Implementation Guide (Section 8.A):
Connects Module 7 to Module 6 Technology Intelligence.
Retrieves and formats Technology Maturity (15% of Innovation Score).
"""

from typing import Dict, Any, Optional
from app.schemas.module7_member4 import TechnologyMaturityResponse

FACTOR_WEIGHT = 0.15  # 15% overall Module 7 weight


def get_technology_maturity(technology_id: str, custom_data: Optional[Dict[str, Any]] = None) -> TechnologyMaturityResponse:
    """
    Retrieves Technology Maturity evidence from Module 6 for a given technology ID
    and formats it into TechnologyMaturityResponse schema for Module 7 integration.
    """
    if custom_data:
        stage = custom_data.get("stage", "Developing")
        score = float(custom_data.get("score", 67.0))
        adoption = float(custom_data.get("adoption", 28.0))
        confidence = float(custom_data.get("confidence", 0.81))
    else:
        # Default mock / database integration response for technology maturity
        stage = "Developing"
        score = 67.0
        adoption = 28.0
        confidence = 0.81

    weighted_contribution = round(score * FACTOR_WEIGHT, 2)

    return TechnologyMaturityResponse(
        technology_id=technology_id,
        stage=stage,
        score=score,
        adoption=adoption,
        confidence=confidence,
        factor_weight=FACTOR_WEIGHT,
        weighted_contribution=weighted_contribution
    )
