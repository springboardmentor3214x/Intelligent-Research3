"""
app/services/patent_strength_service.py
------------------------------------------
Implements the Patent Strength formula:

    patentStrengthScore =
        activity            * 0.20
      + growth              * 0.20
      + citations           * 0.20
      + familyBreadth       * 0.15
      + coverage            * 0.15
      + competitorActivity  * 0.10

All six indicators arrive already normalized to 0-100 (use
normalization_service.py on Module 5's raw patent counts before calling
this). Patent count alone is NEVER treated as patent strength - it's one
of six equally-documented signals.

  - activity:            current scale of patent filings for this technology
  - growth:               year-over-year growth in patent filings
  - citations:            how often these patents are cited by others
  - family_breadth:       how many countries/jurisdictions the patents cover
  - coverage:             breadth across different technology sub-areas
  - competitor_activity:  how many distinct organizations are patenting here
"""

from typing import Optional, Dict

SUB_WEIGHTS = {
    "activity": 0.20,
    "growth": 0.20,
    "citations": 0.20,
    "family_breadth": 0.15,
    "coverage": 0.15,
    "competitor_activity": 0.10,
}


def compute_patent_strength(
    activity: Optional[float] = None,
    growth: Optional[float] = None,
    citations: Optional[float] = None,
    family_breadth: Optional[float] = None,
    coverage: Optional[float] = None,
    competitor_activity: Optional[float] = None,
) -> Dict:
    indicators = {
        "activity": activity,
        "growth": growth,
        "citations": citations,
        "family_breadth": family_breadth,
        "coverage": coverage,
        "competitor_activity": competitor_activity,
    }

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
