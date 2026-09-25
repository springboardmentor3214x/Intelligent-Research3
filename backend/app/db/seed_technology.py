"""
Seed Technology Data – Module 6
====================================================
⚠️  DEMO DATA — NOT REAL PRODUCTION DATA ⚠️
====================================================

This seeds the database with clearly-labeled demo technologies
for local development and testing.

Run with:
    python -m app.db.seed_technology

Or call seed_demo_technologies(db) from code.
"""
from __future__ import annotations

import logging
import os
import sys
from datetime import datetime

# Ensure backend root is on sys.path if run directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from sqlalchemy.orm import Session

from app.models.technology import (
    Technology, TechnologyMetric, TechnologyTrend,
    TechnologyMaturity, TechnologyOpportunity, TechnologyCompetitor,
)
from app.services.trend_service import calculate_trend
from app.services.adoption_service import analyse_adoption
from app.services.maturity_service import analyse_maturity
from app.services.normalization_service import build_normalization_context, normalize_technology
from app.services.opportunity_service import detect_opportunities

logger = logging.getLogger(__name__)

# ── DEMO TECHNOLOGIES ──────────────────────────────────────────────────────
# ALL data below is clearly labeled DEMO and uses approximate illustrative values.

DEMO_TECHNOLOGIES = [
    {
        "technology_id": "TECH_QUANTUM_COMPUTING",
        "name": "Quantum Computing",
        "domain": "Quantum Technology",
        "description": "Computation using quantum-mechanical phenomena such as superposition and entanglement.",
        "keywords": ["quantum", "qubits", "superposition", "entanglement", "quantum gates"],
        "related_technologies": ["Cryptography", "Machine Learning", "Optimization"],
        "yearly_metrics": {
            2019: dict(research_papers=100, patents=20,  organizations=10, applications=3,  adoption_rate=3.0),
            2020: dict(research_papers=140, patents=28,  organizations=14, applications=4,  adoption_rate=4.0),
            2021: dict(research_papers=180, patents=35,  organizations=18, applications=5,  adoption_rate=5.0),
            2022: dict(research_papers=350, patents=60,  organizations=30, applications=8,  adoption_rate=7.0),
            2023: dict(research_papers=700, patents=110, organizations=48, applications=13, adoption_rate=9.0),
            2024: dict(research_papers=1200, patents=170, organizations=65, applications=18, adoption_rate=11.0),
            2025: dict(research_papers=1800, patents=240, organizations=90, applications=25, adoption_rate=14.0),
        },
    },
    {
        "technology_id": "TECH_LARGE_LANGUAGE_MODELS",
        "name": "Large Language Models",
        "domain": "Artificial Intelligence",
        "description": "Deep learning models trained on large text corpora capable of natural language generation and understanding.",
        "keywords": ["LLM", "transformer", "GPT", "BERT", "language model", "natural language processing"],
        "related_technologies": ["Deep Learning", "NLP", "Generative AI"],
        "yearly_metrics": {
            2019: dict(research_papers=50,   patents=8,   organizations=5,  applications=2,  adoption_rate=2.0),
            2020: dict(research_papers=120,  patents=20,  organizations=12, applications=4,  adoption_rate=5.0),
            2021: dict(research_papers=300,  patents=45,  organizations=28, applications=8,  adoption_rate=10.0),
            2022: dict(research_papers=800,  patents=120, organizations=65, applications=18, adoption_rate=25.0),
            2023: dict(research_papers=2500, patents=350, organizations=180, applications=45, adoption_rate=55.0),
            2024: dict(research_papers=5000, patents=680, organizations=320, applications=80, adoption_rate=72.0),
            2025: dict(research_papers=8000, patents=1050, organizations=480, applications=120, adoption_rate=85.0),
        },
    },
    {
        "technology_id": "TECH_EDGE_AI",
        "name": "Edge AI",
        "domain": "Artificial Intelligence",
        "description": "Running AI inference on edge devices (IoT, mobile, embedded systems) rather than centralised cloud.",
        "keywords": ["edge computing", "embedded AI", "TinyML", "on-device inference", "IoT AI"],
        "related_technologies": ["IoT", "Deep Learning", "5G"],
        "yearly_metrics": {
            2019: dict(research_papers=80,  patents=12,  organizations=8,  applications=3,  adoption_rate=4.0),
            2020: dict(research_papers=130, patents=20,  organizations=13, applications=5,  adoption_rate=6.0),
            2021: dict(research_papers=220, patents=33,  organizations=22, applications=8,  adoption_rate=9.0),
            2022: dict(research_papers=390, patents=58,  organizations=38, applications=14, adoption_rate=15.0),
            2023: dict(research_papers=650, patents=95,  organizations=60, applications=22, adoption_rate=25.0),
            2024: dict(research_papers=980, patents=145, organizations=85, applications=32, adoption_rate=38.0),
            2025: dict(research_papers=1500, patents=220, organizations=120, applications=48, adoption_rate=52.0),
        },
    },
    {
        "technology_id": "TECH_CRISPR",
        "name": "CRISPR Gene Editing",
        "domain": "Biotechnology",
        "description": "A precise gene-editing technology enabling targeted modifications to DNA sequences.",
        "keywords": ["CRISPR", "gene editing", "Cas9", "genomics", "therapeutics"],
        "related_technologies": ["Genomics", "Synthetic Biology", "Drug Discovery"],
        "yearly_metrics": {
            2019: dict(research_papers=5000, patents=800,  organizations=200, applications=35, adoption_rate=30.0),
            2020: dict(research_papers=5200, patents=840,  organizations=210, applications=38, adoption_rate=33.0),
            2021: dict(research_papers=5400, patents=870,  organizations=218, applications=40, adoption_rate=36.0),
            2022: dict(research_papers=5500, patents=890,  organizations=225, applications=42, adoption_rate=40.0),
            2023: dict(research_papers=5600, patents=910,  organizations=230, applications=45, adoption_rate=44.0),
            2024: dict(research_papers=5650, patents=920,  organizations=235, applications=47, adoption_rate=47.0),
            2025: dict(research_papers=5700, patents=930,  organizations=240, applications=50, adoption_rate=50.0),
        },
    },
    {
        "technology_id": "TECH_BLOCKCHAIN",
        "name": "Blockchain",
        "domain": "Distributed Systems",
        "description": "Distributed ledger technology enabling decentralised, tamper-resistant records.",
        "keywords": ["blockchain", "distributed ledger", "smart contracts", "DeFi", "cryptocurrency"],
        "related_technologies": ["Cryptography", "IoT", "Supply Chain"],
        "yearly_metrics": {
            2019: dict(research_papers=2000, patents=500,  organizations=100, applications=20, adoption_rate=20.0),
            2020: dict(research_papers=2200, patents=560,  organizations=110, applications=22, adoption_rate=22.0),
            2021: dict(research_papers=2500, patents=620,  organizations=120, applications=25, adoption_rate=28.0),
            2022: dict(research_papers=2300, patents=580,  organizations=115, applications=23, adoption_rate=25.0),
            2023: dict(research_papers=2100, patents=540,  organizations=108, applications=21, adoption_rate=24.0),
            2024: dict(research_papers=1900, patents=500,  organizations=100, applications=20, adoption_rate=22.0),
            2025: dict(research_papers=1800, patents=470,  organizations=95,  applications=19, adoption_rate=21.0),
        },
    },
]


def seed_demo_technologies(db: Session) -> int:
    """
    Seed demo technologies into the database.
    Skips already-existing records.
    Returns number of technologies seeded.
    """
    # Build cross-technology normalization context
    tech_aggregates = []
    for t in DEMO_TECHNOLOGIES:
        metrics = t["yearly_metrics"]
        yrs = sorted(metrics.keys())
        r_vals = [metrics[y]["research_papers"] for y in yrs]
        p_vals = [metrics[y]["patents"] for y in yrs]
        o_vals = [metrics[y]["organizations"] for y in yrs]
        a_vals = [metrics[y]["applications"] for y in yrs]
        trend = calculate_trend(r_vals, p_vals, o_vals, a_vals, yrs)
        tech_aggregates.append({
            "technology_id": t["technology_id"],
            "total_research": sum(r_vals),
            "total_patents": sum(p_vals),
            "total_orgs": max(o_vals),
            "total_apps": max(a_vals),
            "avg_research_growth": trend.get("research_growth") or 0,
            "avg_patent_growth": trend.get("patent_growth") or 0,
        })

    context = build_normalization_context(tech_aggregates)

    seeded = 0
    for t_data in DEMO_TECHNOLOGIES:
        existing = db.query(Technology).filter(
            Technology.technology_id == t_data["technology_id"]
        ).first()
        if existing:
            logger.info("DEMO: skipping existing technology %s", t_data["technology_id"])
            continue

        tech = Technology(
            technology_id=t_data["technology_id"],
            name=t_data["name"],
            domain=t_data["domain"],
            description=t_data["description"],
            keywords=t_data["keywords"],
            related_technologies=t_data["related_technologies"],
            is_demo=True,
        )
        db.add(tech)
        db.flush()

        metrics = t_data["yearly_metrics"]
        yrs = sorted(metrics.keys())
        r_vals = [metrics[y]["research_papers"] for y in yrs]
        p_vals = [metrics[y]["patents"] for y in yrs]
        o_vals = [metrics[y]["organizations"] for y in yrs]
        a_vals = [metrics[y]["applications"] for y in yrs]
        adopt_vals = [float(metrics[y].get("adoption_rate", 0)) for y in yrs]

        for year in yrs:
            m = metrics[year]
            db.add(TechnologyMetric(
                technology_id=tech.id,
                year=year,
                research_papers=m["research_papers"],
                patents=m["patents"],
                organizations=m["organizations"],
                applications=m["applications"],
                adoption_rate=m.get("adoption_rate"),
                source="DEMO_DATA",
                is_demo=True,
            ))
        db.flush()

        trend = calculate_trend(r_vals, p_vals, o_vals, a_vals, yrs)
        db.add(TechnologyTrend(technology_id=tech.id, **trend))
        db.flush()

        # Find this tech's aggregate
        agg = next(a for a in tech_aggregates if a["technology_id"] == t_data["technology_id"])
        normalized = normalize_technology(agg, context)

        adoption = analyse_adoption(adopt_vals, yrs)
        maturity = analyse_maturity(
            technology_id=t_data["technology_id"],
            indicators=normalized,
            trend=trend,
            adoption={"level": adoption["level"], "trend": adoption["trend"]},
            data_coverage={
                "yearsAvailable": len(yrs),
                "researchYears": len(r_vals),
                "patentYears": len(p_vals),
                "organizationYears": len(o_vals),
                "applicationYears": len(a_vals),
                "adoptionYears": len([v for v in adopt_vals if v is not None]),
            },
        )

        db.add(TechnologyMaturity(
            technology_id=tech.id,
            stage=maturity["stage"],
            score=maturity["score"],
            research_growth_score=normalized.get("research_growth_score"),
            patent_growth_score=normalized.get("patent_growth_score"),
            research_activity_score=normalized.get("research_activity_score"),
            patent_activity_score=normalized.get("patent_activity_score"),
            organization_score=normalized.get("organization_score"),
            diversity_score=normalized.get("diversity_score"),
            adoption_level=adoption["level"],
            adoption_trend=adoption["trend"],
            confidence=trend.get("confidence"),
            explanation=maturity["explanation"],
        ))

        opps = detect_opportunities(
            technology_id=t_data["technology_id"],
            technology_name=t_data["name"],
            trend=trend,
            adoption={"level": adoption["level"], "trend": adoption["trend"]},
            indicators=normalized,
        )
        for opp in opps:
            db.add(TechnologyOpportunity(
                technology_id=tech.id,
                opportunity_type=opp["opportunity_type"],
                title=opp["title"],
                description=opp["description"],
                signals=opp["signals"],
                confidence=opp["confidence"],
            ))

        db.commit()
        seeded += 1
        logger.info("DEMO: seeded technology %s (%s)", t_data["name"], maturity["stage"])

    return seeded


if __name__ == "__main__":
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    from app.db.session import SessionLocal
    from app.db.init_db import init_db
    logging.basicConfig(level=logging.INFO)
    init_db()
    db = SessionLocal()
    try:
        n = seed_demo_technologies(db)
        print(f"Seeded {n} demo technologies.")
    finally:
        db.close()
