"""
Run this to populate the local database with sample records so you can
develop and test against something realistic while Member 4's real
ingestion pipeline isn't ready yet.

Usage: python -m app.seed
"""
from datetime import datetime, timedelta

from app.database import Base, engine, SessionLocal
from app.models import FundingOpportunity

Base.metadata.create_all(bind=engine)

SAMPLE_DATA = [
    dict(
        title="AI for Healthcare Innovation Grant",
        organization="National Science Foundation",
        description="Supports research applying generative AI and machine learning to healthcare diagnostics.",
        funding_amount=250000,
        currency="USD",
        deadline=datetime.utcnow() + timedelta(days=45),
        eligibility="Universities, Research Institutions",
        research_areas="Artificial Intelligence,Healthcare,Generative AI",
        keywords="LLM,Medical Diagnosis,Machine Learning",
        funding_type="Government Grant",
        country="USA",
        source="grants.gov",
        source_url="https://example.gov/grants/ai-health",
        application_url="https://example.gov/apply/ai-health",
        status="open",
    ),
    dict(
        title="Startup Accelerator: Medical Technology",
        organization="HealthTech Ventures",
        description="Seed funding and mentorship for early-stage medical technology startups.",
        funding_amount=100000,
        currency="USD",
        deadline=datetime.utcnow() + timedelta(days=10),
        eligibility="Startups only",
        research_areas="Medical Technology,Healthcare AI",
        keywords="Medical Diagnosis,Startup",
        funding_type="Startup Accelerator",
        country="USA",
        source="healthtechventures.com",
        source_url="https://example.com/accelerator",
        application_url="https://example.com/accelerator/apply",
        status="open",
    ),
    dict(
        title="EU Horizon: Machine Learning for Climate Science",
        organization="European Commission",
        description="Funding for machine learning applications addressing climate research challenges.",
        funding_amount=500000,
        currency="EUR",
        deadline=datetime.utcnow() + timedelta(days=90),
        eligibility="Universities, Enterprises",
        research_areas="Machine Learning,Climate Science",
        keywords="ML,Climate",
        funding_type="Research Council",
        country="EU",
        source="ec.europa.eu",
        source_url="https://example.eu/horizon/ml-climate",
        application_url="https://example.eu/horizon/apply",
        status="open",
    ),
    dict(
        title="Closed: Legacy Robotics Fund",
        organization="Old Foundation",
        description="A previously active fund for robotics research, now closed.",
        funding_amount=80000,
        currency="USD",
        deadline=datetime.utcnow() - timedelta(days=30),
        eligibility="Universities",
        research_areas="Robotics",
        keywords="Robotics",
        funding_type="Innovation Fund",
        country="USA",
        source="oldfoundation.org",
        source_url="https://example.com/legacy",
        application_url="https://example.com/legacy/apply",
        status="closed",
    ),
]


def run():
    db = SessionLocal()
    try:
        if db.query(FundingOpportunity).count() > 0:
            print("Database already has funding records — skipping seed.")
            return
        for record in SAMPLE_DATA:
            db.add(FundingOpportunity(**record))
        db.commit()
        print(f"Seeded {len(SAMPLE_DATA)} funding opportunities.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
