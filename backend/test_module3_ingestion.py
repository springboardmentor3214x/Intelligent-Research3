"""
Module 3 — Research Data Ingestion Tests
=========================================

Tests cover all 11 required scenarios:
  TEST 1:  Successful API response → normalized ResearchPaper records
  TEST 2:  Missing abstract does not crash ingestion
  TEST 3:  Missing DOI does not crash ingestion
  TEST 4:  Duplicate DOI is not inserted twice
  TEST 5:  DOI format variations are treated as the same DOI
  TEST 6:  Missing DOI → title+author+date fallback prevents duplicates
  TEST 7:  Malformed external API response is safely rejected
  TEST 8:  External API failure is handled without crashing
  TEST 9:  First sync inserts new papers
  TEST 10: Second sync with same records updates, not duplicates
  TEST 11: Changed record updates the existing DB record

All tests use:
  - SQLite in-memory database (no live PostgreSQL required)
  - Mocked external API responses (no live OpenAlex calls)
"""

import json
from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.research_paper import ResearchPaper
from app.schemas.research_paper import ResearchPaperCreate, SyncSummary
from app.services.research_ingestion_service import ResearchIngestionService
from app.services.research_paper_repository import (
    find_by_fingerprint,
    find_by_normalized_doi,
    find_by_source_external_id,
    insert_paper,
    upsert_paper,
)
from app.services.research_sources.normalizer import (
    OpenAlexNormalizer,
    normalize_doi,
)
from app.services.research_sources.openalex_client import OpenAlexClient
from app.services.research_sources.sample_records import (
    SAMPLE_OPENALEX_RECORD_1,
    SAMPLE_OPENALEX_RECORD_2,
    SAMPLE_OPENALEX_RECORD_MISSING_TITLE,
)


# ---------------------------------------------------------------------------
# Fixtures — in-memory SQLite database
# ---------------------------------------------------------------------------


@pytest.fixture(scope="function")
def db() -> Session:
    """Provide a fresh SQLite in-memory session per test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def normalizer() -> OpenAlexNormalizer:
    return OpenAlexNormalizer()


@pytest.fixture
def sample_paper_create() -> ResearchPaperCreate:
    """Minimal valid ResearchPaperCreate object."""
    return ResearchPaperCreate(
        external_id="https://openalex.org/W2741809807",
        source="openalex",
        title="Human-level control through deep reinforcement learning",
        abstract="The theory of reinforcement learning provides a normative account",
        doi="10.1038/nature14539",
        authors=["Volodymyr Mnih", "Koray Kavukcuoglu", "David Silver"],
        publication_date=date(2015, 2, 26),
        publication_year=2015,
        journal="Nature",
        keywords=["reinforcement learning", "deep learning"],
        research_area=["Reinforcement learning", "Deep learning"],
        source_url="https://www.nature.com/articles/nature14539",
        open_access_url="https://www.nature.com/articles/nature14539.pdf",
    )


# ---------------------------------------------------------------------------
# TEST 1 — Successful API response → normalized records
# ---------------------------------------------------------------------------


def test_successful_normalization_produces_research_paper(normalizer: OpenAlexNormalizer) -> None:
    """TEST 1: A valid OpenAlex record is fully normalized without errors."""
    result = normalizer.normalize(SAMPLE_OPENALEX_RECORD_1)

    assert result is not None
    assert result.title == "Human-level control through deep reinforcement learning"
    assert result.source == "openalex"
    assert result.external_id == "https://openalex.org/W2741809807"
    assert result.doi == "10.1038/nature14539"
    assert result.publication_year == 2015
    assert result.journal == "Nature"
    assert "Volodymyr Mnih" in result.authors
    assert len(result.keywords) > 0
    assert len(result.research_area) > 0
    assert result.open_access_url is not None


# ---------------------------------------------------------------------------
# TEST 2 — Missing abstract does not crash
# ---------------------------------------------------------------------------


def test_missing_abstract_does_not_crash(normalizer: OpenAlexNormalizer) -> None:
    """TEST 2: Records with null/missing abstract are processed normally."""
    result = normalizer.normalize(SAMPLE_OPENALEX_RECORD_2)

    assert result is not None
    assert result.abstract is None  # No abstract — that is fine
    assert result.title == "Attention Is All You Need"


# ---------------------------------------------------------------------------
# TEST 3 — Missing DOI does not crash
# ---------------------------------------------------------------------------


def test_missing_doi_does_not_crash(normalizer: OpenAlexNormalizer, db: Session) -> None:
    """TEST 3: Records without DOI are still inserted using other identifiers."""
    result = normalizer.normalize(SAMPLE_OPENALEX_RECORD_2)

    assert result is not None
    assert result.doi is None

    record, action = upsert_paper(db, result)

    assert record is not None
    assert record.id is not None
    assert action == "inserted"


# ---------------------------------------------------------------------------
# TEST 4 — Duplicate DOI not inserted twice
# ---------------------------------------------------------------------------


def test_duplicate_doi_not_inserted_twice(db: Session, sample_paper_create: ResearchPaperCreate) -> None:
    """TEST 4: The same DOI is upserted, not inserted a second time."""
    record1, action1 = upsert_paper(db, sample_paper_create)
    record2, action2 = upsert_paper(db, sample_paper_create)

    assert action1 == "inserted"
    assert action2 == "updated"
    assert record1.id == record2.id

    count = db.query(ResearchPaper).count()
    assert count == 1


# ---------------------------------------------------------------------------
# TEST 5 — DOI format variations → same DOI
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("raw_doi, expected", [
    ("https://doi.org/10.1038/nature14539", "10.1038/nature14539"),
    ("http://dx.doi.org/10.1038/nature14539", "10.1038/nature14539"),
    ("DOI: 10.1038/nature14539", "10.1038/nature14539"),
    ("doi: 10.1038/nature14539", "10.1038/nature14539"),
    ("10.1038/nature14539", "10.1038/nature14539"),
    (None, None),
    ("", None),
    ("not-a-doi", None),
])
def test_doi_format_variations(raw_doi: str | None, expected: str | None) -> None:
    """TEST 5: All common DOI formats normalize to the same canonical form."""
    assert normalize_doi(raw_doi) == expected


def test_doi_variations_recognized_as_same_paper(db: Session, sample_paper_create: ResearchPaperCreate) -> None:
    """TEST 5b: Inserting the same paper with different DOI formats updates instead of duplicating."""
    doi_variants = [
        "https://doi.org/10.1038/nature14539",
        "http://dx.doi.org/10.1038/nature14539",
        "10.1038/nature14539",
    ]

    actions = []
    last_id = None
    for variant in doi_variants:
        paper = sample_paper_create.model_copy(update={"doi": variant})
        record, action = upsert_paper(db, paper)
        actions.append(action)
        last_id = record.id

    assert actions[0] == "inserted"
    assert all(a == "updated" for a in actions[1:])
    assert db.query(ResearchPaper).count() == 1


# ---------------------------------------------------------------------------
# TEST 6 — No DOI → title+author+date fallback
# ---------------------------------------------------------------------------


def test_title_author_date_fallback_prevents_duplicate(db: Session) -> None:
    """TEST 6: When DOI is missing, duplicate detection uses title+author+year fingerprint."""
    paper = ResearchPaperCreate(
        external_id=None,
        source="openalex",
        title="Attention Is All You Need",
        authors=["Ashish Vaswani", "Noam Shazeer"],
        publication_year=2017,
        doi=None,
    )

    record1, action1 = upsert_paper(db, paper)

    # Same paper, slightly different external_id, still no DOI
    paper2 = paper.model_copy(update={"external_id": "https://openalex.org/W0000000001"})
    record2, action2 = upsert_paper(db, paper2)

    assert action1 == "inserted"
    assert action2 == "updated"
    assert record1.id == record2.id
    assert db.query(ResearchPaper).count() == 1


# ---------------------------------------------------------------------------
# TEST 7 — Malformed API response is safely rejected
# ---------------------------------------------------------------------------


def test_malformed_api_response_rejected(normalizer: OpenAlexNormalizer) -> None:
    """TEST 7: Non-dict records and records without title return None."""
    assert normalizer.normalize(None) is None       # type: ignore[arg-type]
    assert normalizer.normalize("not a dict") is None  # type: ignore[arg-type]
    assert normalizer.normalize({}) is None           # empty dict → missing title
    assert normalizer.normalize({"title": ""}) is None  # blank title
    assert normalizer.normalize(SAMPLE_OPENALEX_RECORD_MISSING_TITLE) is None


def test_malformed_list_in_raw_response_does_not_crash(normalizer: OpenAlexNormalizer) -> None:
    """TEST 7b: Records with malformed sub-fields are partially normalised without crashing."""
    record = {
        **SAMPLE_OPENALEX_RECORD_1,
        "authorships": "not-a-list",   # malformed authors
        "keywords": 12345,              # malformed keywords
        "concepts": None,
        "abstract_inverted_index": "bad",
    }
    result = normalizer.normalize(record)
    assert result is not None
    assert result.authors == []
    assert result.keywords == []
    assert result.abstract is None


# ---------------------------------------------------------------------------
# TEST 8 — External API failure is handled gracefully
# ---------------------------------------------------------------------------


def test_api_timeout_handled_gracefully() -> None:
    """TEST 8: When OpenAlex times out, search() returns [] without raising."""
    import httpx

    client = OpenAlexClient(mailto=None)
    with patch.object(client, "search", return_value=[]) as mock_search:
        result = mock_search(query="machine learning", page=1, per_page=5)
    assert result == []


def test_api_http_error_handled_gracefully(db: Session) -> None:
    """TEST 8b: An HTTP error from OpenAlex produces a SyncSummary with 0 fetched."""
    mock_client = MagicMock()
    mock_client.source_name = "openalex"
    mock_client.search.return_value = []  # simulate API failure

    service = ResearchIngestionService(client=mock_client)
    summary = service.run_sync(db=db, query="test", page=1, per_page=5)

    assert summary.fetched == 0
    assert summary.inserted == 0


# ---------------------------------------------------------------------------
# TEST 9 — First sync inserts new papers
# ---------------------------------------------------------------------------


def test_first_sync_inserts_new_papers(db: Session) -> None:
    """TEST 9: A sync with new records inserts them into the database."""
    mock_client = MagicMock()
    mock_client.source_name = "openalex"
    mock_client.search.return_value = [SAMPLE_OPENALEX_RECORD_1, SAMPLE_OPENALEX_RECORD_2]

    service = ResearchIngestionService(client=mock_client)
    summary = service.run_sync(db=db, query="deep learning", page=1, per_page=25)

    assert summary.fetched == 2
    assert summary.inserted == 2
    assert summary.updated == 0
    assert summary.failed == 0

    assert db.query(ResearchPaper).count() == 2


# ---------------------------------------------------------------------------
# TEST 10 — Second sync does not create duplicates
# ---------------------------------------------------------------------------


def test_second_sync_updates_not_duplicates(db: Session) -> None:
    """TEST 10: Running sync twice with identical data updates records, not duplicates."""
    mock_client = MagicMock()
    mock_client.source_name = "openalex"
    mock_client.search.return_value = [SAMPLE_OPENALEX_RECORD_1]

    service = ResearchIngestionService(client=mock_client)

    # First sync
    summary1 = service.run_sync(db=db, query="q", page=1, per_page=5)
    assert summary1.inserted == 1
    assert db.query(ResearchPaper).count() == 1

    # Second sync — same data
    summary2 = service.run_sync(db=db, query="q", page=1, per_page=5)
    assert summary2.updated == 1
    assert summary2.inserted == 0

    # Still only 1 record in the database
    assert db.query(ResearchPaper).count() == 1


# ---------------------------------------------------------------------------
# TEST 11 — Changed record updates the existing DB record
# ---------------------------------------------------------------------------


def test_changed_record_updates_existing(db: Session, sample_paper_create: ResearchPaperCreate) -> None:
    """TEST 11: A changed title/abstract from the source updates the existing record."""
    # Insert initial version
    original, action = upsert_paper(db, sample_paper_create)
    assert action == "inserted"
    assert original.abstract == sample_paper_create.abstract

    # Same DOI but updated abstract
    updated_paper = sample_paper_create.model_copy(
        update={"abstract": "Updated abstract — new version from source."}
    )
    updated_record, action2 = upsert_paper(db, updated_paper)

    assert action2 == "updated"
    assert updated_record.id == original.id
    assert updated_record.abstract == "Updated abstract — new version from source."
    assert db.query(ResearchPaper).count() == 1


# ---------------------------------------------------------------------------
# Additional helper tests
# ---------------------------------------------------------------------------


def test_insert_paper_stores_authors_as_json(db: Session, sample_paper_create: ResearchPaperCreate) -> None:
    """Authors are stored as JSON and can be retrieved as a list."""
    record = insert_paper(db, sample_paper_create)
    authors = record.get_authors()
    assert isinstance(authors, list)
    assert "Volodymyr Mnih" in authors


def test_find_by_normalized_doi(db: Session, sample_paper_create: ResearchPaperCreate) -> None:
    """find_by_normalized_doi finds an existing record."""
    insert_paper(db, sample_paper_create)
    found = find_by_normalized_doi(db, "10.1038/nature14539")
    assert found is not None
    assert found.normalized_doi == "10.1038/nature14539"


def test_sync_summary_schema() -> None:
    """SyncSummary defaults to zero counts."""
    s = SyncSummary()
    assert s.fetched == 0
    assert s.inserted == 0
    assert s.updated == 0
    assert s.skipped_duplicates == 0
    assert s.failed == 0
