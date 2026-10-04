from typing import Dict, Optional


FACTOR_WEIGHTS = {
    "research_novelty": 0.30,
    "patent_strength": 0.20,
    "technology_maturity": 0.15,
    "market_potential": 0.20,
    "funding_relevance": 0.15,
}


def calculate_innovation_score(
    research_novelty: Optional[float],
    patent_strength: Optional[float],
    technology_maturity: Optional[float],
    market_potential: Optional[float],
    funding_relevance: Optional[float],
) -> Dict:

    factors = {
        "research_novelty": research_novelty,
        "patent_strength": patent_strength,
        "technology_maturity": technology_maturity,
        "market_potential": market_potential,
        "funding_relevance": funding_relevance,
    }

    available = {
        name: score
        for name, score in factors.items()
        if score is not None
    }

    missing = [
        name
        for name, score in factors.items()
        if score is None
    ]

    # Fewer than 3 available factors is not enough
    # to calculate a reliable innovation score.
    if len(available) < 3:
        return {
            "innovation_score": None,
            "status": "insufficient_data",
            "missing_factors": missing,
            "explanation": (
                "Innovation score could not be calculated because "
                "fewer than three factor scores are available."
            ),
        }

    # Weighted score using available factors only.
    available_weight = sum(
        FACTOR_WEIGHTS[name]
        for name in available
    )

    weighted_score = sum(
        score * FACTOR_WEIGHTS[name]
        for name, score in available.items()
    )

    innovation_score = weighted_score / available_weight

    if missing:
        status = "calculated_with_adjusted_weights"
        explanation = (
            "Innovation score was calculated using the available "
            "factor scores. Missing factors were excluded and the "
            "remaining weights were normalized."
        )
    else:
        status = "complete"

        strongest_factor = max(
            available,
            key=available.get
        )

        explanation = (
            f"Innovation score is {round(innovation_score, 2)}. "
            f"Research Novelty scored {research_novelty}, "
            f"Patent Strength scored {patent_strength}, "
            f"Technology Maturity scored {technology_maturity}, "
            f"Market Potential scored {market_potential}, "
            f"and Funding Relevance scored {funding_relevance}. "
            f"The strongest factor is "
            f"{strongest_factor.replace('_', ' ').title()} "
            f"({available[strongest_factor]})."
        )

    return {
        "innovation_score": round(innovation_score, 2),
        "status": status,
        "missing_factors": missing,
        "explanation": explanation,
    }