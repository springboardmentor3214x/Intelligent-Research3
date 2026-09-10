"""
Tests for Research Insights & Research Gaps Service and Deduplication — Module 3.
"""

import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.research_paper import ResearchPaper
from app.services.research_insights_service import (
    _deduplicate_papers,
    generate_research_insights,
)
from app.services.research_sources.normalizer import make_title_fingerprint

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_zero_duplicate_paper_deduplication():
    """Verify that _deduplicate_papers strictly prevents any duplicate data."""
    p1 = ResearchPaper(
        id=1,
        title="Generative AI in Healthcare: Clinical Validation",
        doi="10.1038/s41746-024-001",
        title_fingerprint=make_title_fingerprint("Generative AI in Healthcare: Clinical Validation"),
    )
    # Duplicate with same DOI
    p2 = ResearchPaper(
        id=2,
        title="Generative AI in Healthcare: Clinical Validation (Duplicate)",
        doi="https://doi.org/10.1038/s41746-024-001",
        title_fingerprint=make_title_fingerprint("Generative AI in Healthcare: Clinical Validation (Duplicate)"),
    )
    # Duplicate with same Title Fingerprint (different DOI)
    p3 = ResearchPaper(
        id=3,
        title="Generative AI in Healthcare: Clinical Validation",
        doi="10.1038/another.doi.002",
        title_fingerprint=make_title_fingerprint("Generative AI in Healthcare: Clinical Validation"),
    )
    # Unique paper
    p4 = ResearchPaper(
        id=4,
        title="Quantum Error Correction for Near-Term Architectures",
        doi="10.1103/PhysRevLett.132.070601",
        title_fingerprint=make_title_fingerprint("Quantum Error Correction for Near-Term Architectures"),
    )

    deduped = _deduplicate_papers([p1, p2, p3, p4])
    assert len(deduped) == 2
    titles = [p.title for p in deduped]
    assert "Generative AI in Healthcare: Clinical Validation" in titles
    assert "Quantum Error Correction for Near-Term Architectures" in titles


def test_generate_research_insights_output_structure():
    """Verify that generate_research_insights returns rich structured gap analysis."""
    db = TestingSessionLocal()
    papers = [
        ResearchPaper(
            title="Transformer Models in Medical Imaging",
            abstract="Study on vision transformers for chest pathology detection with limited clinical trial testing.",
            authors=json.dumps(["Dr. Alice", "Dr. Bob"]),
            publication_year=2024,
            research_area=json.dumps(["Healthcare AI", "Computer Vision"]),
            keywords=json.dumps(["Transformers", "Medical Imaging", "Clinical Validation"]),
            doi="10.1000/182",
            title_fingerprint=make_title_fingerprint("Transformer Models in Medical Imaging"),
        ),
        ResearchPaper(
            title="Explainable Clinical AI via Self-Supervised Representations",
            abstract="Deep learning framework with attention maps addressing algorithmic interpretability.",
            authors=json.dumps(["Dr. Charlie"]),
            publication_year=2023,
            research_area=json.dumps(["Healthcare AI"]),
            keywords=json.dumps(["Explainability", "Clinical AI"]),
            doi="10.1000/183",
            title_fingerprint=make_title_fingerprint("Explainable Clinical AI via Self-Supervised Representations"),
        ),
    ]
    for p in papers:
        db.add(p)
    db.commit()

    insights = generate_research_insights(db=db, domain="Healthcare AI")
    assert insights["analyzed_papers_count"] == 2
    assert "landscape_overview" in insights
    assert len(insights["research_gaps"]) >= 1
    assert "future_directions" in insights
    assert "technology_and_patent_opportunities" in insights
    assert "disclaimer" in insights
    db.close()
