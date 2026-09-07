"""Seed local development publications for Module 3 preview.

Run with: PYTHONPATH=backend python backend/scripts/seed_demo_research.py
"""
from datetime import date
import bcrypt

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.models.profile import Publication, ResearchProfile, ResearchTag, TagKind
from app.models.user import User


def main():
    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email="demo.researcher@example.com").first()
        if user is None:
            password_hash = bcrypt.hashpw(b"DemoPassword123", bcrypt.gensalt()).decode()
            user = User(name="Demo Researcher", email="demo.researcher@example.com", password_hash=password_hash, research_domain="Artificial Intelligence")
            db.add(user)
            db.flush()
        profile = db.query(ResearchProfile).filter_by(user_id=user.id).first() or ResearchProfile(user_id=user.id)
        if profile.id is None:
            db.add(profile)
            db.flush()
        if not profile.tags:
            profile.tags.extend([
                ResearchTag(kind=TagKind.RESEARCH_AREA.value, value="Computer Vision", normalized_value="computer vision"),
                ResearchTag(kind=TagKind.RESEARCH_KEYWORD.value, value="Explainable AI", normalized_value="explainable ai"),
                ResearchTag(kind=TagKind.RESEARCH_KEYWORD.value, value="Deep Learning", normalized_value="deep learning"),
            ])
        if not profile.publications:
            profile.publications.extend([
                Publication(publication_title="Explainable AI for medical image triage", authors="A. Rao, B. Chen", publication_date=date(2023, 6, 1), research_domain="Artificial Intelligence", keywords="Explainable AI, Deep Learning, Medical Imaging"),
                Publication(publication_title="Robust vision models under distribution shift", authors="A. Rao, C. Silva", publication_date=date(2024, 4, 1), research_domain="Artificial Intelligence", keywords="Computer Vision, Deep Learning, Robustness"),
                Publication(publication_title="Human-centered evaluation of vision systems", authors="A. Rao, D. Jones", publication_date=date(2025, 2, 1), research_domain="Artificial Intelligence", keywords="Computer Vision, Explainable AI, Evaluation"),
                Publication(publication_title="Interpretable multimodal learning", authors="A. Rao, E. Patel", publication_date=date(2025, 9, 1), research_domain="Artificial Intelligence", keywords="Explainable AI, Multimodal Learning, Deep Learning"),
            ])
        db.commit()
        print("Seeded demo.researcher@example.com / DemoPassword123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
