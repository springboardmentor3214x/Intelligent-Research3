"""
backend/app/routers/module7_member4.py
Author: Member 4 (Module 7: Technology Maturity 15% + Market Potential 20% + Funding Relevance 15%)

API Endpoints defined in Module 6 & 7 Implementation Guide (Section 8, Section 13, Section 15):
- GET  /api/technologies/{technology_id}/maturity
- GET  /api/funding/relevant/{technology_id}
- POST /api/innovation/market-potential
- GET  /api/innovation/member4-factors/{technology_id}
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.module7_member4 import (
    TechnologyMaturityResponse,
    MarketPotentialInput,
    MarketPotentialResponse,
    FundingRelevanceInput,
    FundingRelevanceResponse,
    Member4FactorsSummary,
)
from app.services.technology_maturity_service import get_technology_maturity
from app.services.market_potential_service import (
    calculate_market_potential_score,
    get_market_potential_for_technology,
)
from app.services.funding_relevance_service import get_funding_relevance_for_technology

router = APIRouter(tags=["Module 7 - Member 4 (Maturity, Market Potential & Funding Relevance)"])


@router.get(
    "/technologies/{technology_id}/maturity",
    response_model=TechnologyMaturityResponse,
    summary="Get Technology Maturity (Module 6 -> Module 7 15% factor)",
)
def read_technology_maturity(technology_id: str):
    """
    Connects Module 7 to Module 6.
    Returns maturity stage, normalized maturity score (15% factor weight), adoption, and confidence metrics.
    """
    return get_technology_maturity(technology_id)


@router.get(
    "/funding/relevant/{technology_id}",
    response_model=FundingRelevanceResponse,
    summary="Get Relevant Funding Opportunities (Module 4 -> Module 7 15% factor)",
)
def read_relevant_funding(technology_id: str, db: Session = Depends(get_db)):
    """
    Connects Module 7 to Module 4 funding intelligence.
    Returns funding relevance factor score (15% weight) based on opportunity count, relevance, eligibility, and program activity.
    """
    return get_funding_relevance_for_technology(technology_id=technology_id, db=db)


@router.post(
    "/innovation/market-potential",
    response_model=MarketPotentialResponse,
    summary="Calculate Market Potential Score (Module 7 20% factor)",
)
def calculate_market_potential(technology_id: str, payload: MarketPotentialInput):
    """
    Calculates Market Potential factor score (20% weight in Module 7) from 5 constituent indicators:
    applicationBreadth (25%), industryRelevance (20%), demandSignals (20%), organizationBreadth (15%), applicationGrowth (20%).
    """
    return get_market_potential_for_technology(technology_id=technology_id, custom_inputs=payload)


@router.get(
    "/innovation/member4-factors/{technology_id}",
    response_model=Member4FactorsSummary,
    summary="Get Combined Member 4 Factors for Module 7 Innovation Scoring Engine",
)
def get_member4_factors_summary(technology_id: str, db: Session = Depends(get_db)):
    """
    Provides all 3 factors owned/connected by Member 4 (Technology Maturity 15%, Market Potential 20%, Funding Relevance 15%)
    totaling 50% of the overall Module 7 Innovation Score calculation.
    Targeted for Member 5's Innovation Scoring Engine integration.
    """
    maturity = get_technology_maturity(technology_id)
    market = get_market_potential_for_technology(technology_id)
    funding = get_funding_relevance_for_technology(technology_id=technology_id, db=db)

    total_member4_contribution = round(
        maturity.weighted_contribution + market.weighted_contribution + funding.weighted_contribution, 2
    )

    return Member4FactorsSummary(
        technology_id=technology_id,
        technology_maturity=maturity,
        market_potential=market,
        funding_relevance=funding,
        combined_member4_weighted_score=total_member4_contribution,
    )
