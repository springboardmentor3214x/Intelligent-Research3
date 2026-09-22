"""
app/services/novelty_service.py
----------------------------------
Implements the Research Novelty formula:

    researchNoveltyScore =
        distinctiveness        * 0.35
      + researchGapEvidence    * 0.25
      + emergingTopicEvidence  * 0.20
      + newDirectionEvidence   * 0.20

WHERE EACH INDICATOR COMES FROM:
  - distinctiveness:       calculated HERE, from text similarity
                            (low similarity to existing research -> high distinctiveness)
  - researchGapEvidence:   supplied by Module 3 (Research Intelligence) -
                            e.g. "is this topic under-studied?"
  - emergingTopicEvidence: supplied by Module 3 - e.g. "is this topic
                            trending upward in recent publications?"
  - newDirectionEvidence:  supplied by Module 3 - e.g. "does this combine
                            fields that aren't usually combined?"

Member 3 does NOT recalculate Module 3's job. This service only combines
Module 3's pre-computed 0-100 evidence scores with its own distinctiveness
calculation. If Module 3 hasn't built those endpoints yet, pass None for
that field - see the missing-data handling below.
"""

from typing import List, Optional, Dict
from app.services.semantic_service import get_similarity

SUB_WEIGHTS = {
    "distinctiveness": 0.35,
    "research_gap_evidence": 0.25,
    "emerging_topic_evidence": 0.20,
    "new_direction_evidence": 0.20,
}


def distinctiveness_from_similarity(similarity: float) -> float:
    """Lower similarity to existing work -> higher distinctiveness. Scaled 0-100."""
    return (1 - similarity) * 100


def compute_research_novelty(
    new_text: str,
    existing_texts: List[str],
    research_gap_evidence: Optional[float] = None,
    emerging_topic_evidence: Optional[float] = None,
    new_direction_evidence: Optional[float] = None,
) -> Dict:
    """
    Main function called by the API endpoint.
    Returns a dict with the final 0-100 score, a status flag, and the
    individual indicator values used - so the result is fully traceable.
    """
    similarity = get_similarity(new_text, existing_texts)
    distinctiveness = None if similarity is None else distinctiveness_from_similarity(similarity)

    indicators = {
        "distinctiveness": distinctiveness,
        "research_gap_evidence": research_gap_evidence,
        "emerging_topic_evidence": emerging_topic_evidence,
        "new_direction_evidence": new_direction_evidence,
    }

    # --- missing-data handling: never silently treat a missing value as 0 ---
    available = {k: v for k, v in indicators.items() if v is not None}
    missing = [k for k in indicators if k not in available]

    if not available:
        return {
            "score": None,
            "status": "insufficient_data",
            "indicators": indicators,
            "missing": missing,
        }

    weight_sum = sum(SUB_WEIGHTS[k] for k in available)
    score = sum(available[k] * SUB_WEIGHTS[k] for k in available) / weight_sum

    return {
        "score": round(score, 2),
        "status": "calculated_with_adjusted_weights" if missing else "complete",
        "indicators": indicators,
        "missing": missing,
    }
