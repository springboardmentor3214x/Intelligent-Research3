from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.profile import Publication, ResearchProfile, ResearchTag, TagKind
from app.models.user import User
from app.services import research_intelligence as intelligence


def make_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return Session(engine)


def make_user(db):
    user = User(name="Test Researcher", email="test@example.com", password_hash="hash", research_domain="AI")
    db.add(user)
    db.flush()
    profile = ResearchProfile(user_id=user.id)
    db.add(profile)
    db.flush()
    return user, profile


def add_paper(db, profile, title, year, keywords=""):
    paper = Publication(profile_id=profile.id, publication_title=title, authors="A. Researcher", publication_date=date(year, 1, 1), research_domain="AI", keywords=keywords)
    db.add(paper)
    db.flush()
    return paper


def test_analysis_schema_and_missing_content_are_safe():
    db = make_db()
    user, profile = make_user(db)
    paper = add_paper(db, profile, "Vision model evaluation", 2025)
    result = intelligence.analyze_paper(db, paper.id, user)
    assert result["source"]["content_basis"]
    assert result["ai_analysis"]["limitations"]
    assert set(result["ai_analysis"]) == {"summary", "problem", "methodology", "findings", "limitations", "future_directions"}


def test_provider_failure_returns_local_fallback(monkeypatch):
    db = make_db()
    user, profile = make_user(db)
    paper = add_paper(db, profile, "Robust AI systems", 2025, "Safety")
    class BrokenProvider:
        name = "broken"
        def analyze(self, context):
            raise RuntimeError("provider down")
    monkeypatch.setattr(intelligence, "get_ai_provider", lambda: BrokenProvider())
    result = intelligence.analyze_paper(db, paper.id, user)
    assert result["fallback_used"] is True
    assert result["provider"] == "local-heuristic"


def test_trends_are_derived_from_rows_and_topic_growth():
    db = make_db()
    user, profile = make_user(db)
    add_paper(db, profile, "Explainable models", 2024, "Explainable AI, Models")
    add_paper(db, profile, "Explainable vision", 2025, "Explainable AI, Vision")
    add_paper(db, profile, "Explainable robotics", 2025, "Explainable AI, Robotics")
    result = intelligence.calculate_trends(db, user, {"research_domain": None, "research_area": None, "keyword": None, "start_year": None, "end_year": None})
    assert result["publication_trends"] == [{"year": 2024, "count": 1}, {"year": 2025, "count": 2}]
    assert any(item["topic"] == "explainable ai" and item["growth"] == 1 for item in result["topic_growth"])


def test_empty_insights_and_profile_driven_recommendations():
    db = make_db()
    user, profile = make_user(db)
    filters = {"research_domain": None, "research_area": None, "keyword": None, "start_year": None, "end_year": None}
    assert intelligence.build_insights(db, user, filters)["metrics"]["papers_analyzed"] == 0
    db.add(ResearchTag(profile_id=profile.id, kind=TagKind.RESEARCH_KEYWORD.value, value="robotics", normalized_value="robotics"))
    paper = add_paper(db, profile, "Robotics perception", 2025, "Robotics")
    db.commit()
    keyword_score = intelligence.recommendations(db, user)[0]["relevance_score"]
    db.query(ResearchTag).delete()
    db.commit()
    assert intelligence.recommendations(db, user)[0]["relevance_score"] < keyword_score


def test_openalex_publications_are_normalized(monkeypatch):
    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"meta": {"count": 1}, "results": [{
                "id": "https://openalex.org/W123",
                "title": "Artificial Intelligence",
                "publication_date": "2019-04-02",
                "type": "article",
                "doi": "https://doi.org/10.1234/example",
                "cited_by_count": 7,
                "authorships": [{"author": {"display_name": "Ada Lovelace"}}],
                "primary_location": {"landing_page_url": "https://example.org/paper", "source": {"display_name": "Example Journal"}},
                "topics": [{"display_name": "Artificial intelligence"}],
            }]}

    monkeypatch.setattr(intelligence.httpx, "get", lambda *args, **kwargs: Response())
    result = intelligence.search_openalex_publications("artificial intelligence", date(2019, 1, 1), date(2019, 12, 31), per_page=1)
    assert result["total_results"] == 1
    assert result["publications"][0]["openalex_id"] == "W123"
    assert result["publications"][0]["authors"] == ["Ada Lovelace"]
    assert result["publications"][0]["journal_or_conference"] == "Example Journal"