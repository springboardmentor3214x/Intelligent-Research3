"""
backend/tests/test_funding_ingestion.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Unit tests for the funding data ingestion pipeline.

Coverage (matches the Definition of Done requirements):
  TC-01  Successful NIH source response → normalized FundingOpportunity record
  TC-02  Missing optional fields (amount, deadline) do not crash ingestion
  TC-03  Duplicate external_id is NOT inserted twice
  TC-04  Changed deadline on re-sync updates the existing record
  TC-05  Malformed source response is caught and logged; pipeline continues
  TC-06  Expired/closed status is handled correctly
  TC-07  Grants.gov source response → normalized record
  TC-08  Normalizer correctly parses US-style date (MM/DD/YYYY)
  TC-09  Normalizer correctly parses ISO-8601 date
  TC-10  Network failure returns [] from source client; pipeline records 0 fetched
  TC-11  Analysis response always follows the agreed schema (field presence)
  TC-12  Re-sync with identical data → "duplicate" (no DB write, no second row)

Test strategy:
  - Uses an in-memory SQLite database for full isolation (no external DB needed).
  - Source clients are mocked at the `fetch()` level — no real HTTP calls.
  - The normalizer is tested with real raw dicts (unit tests, no mocking).
  - The ingestion orchestrator is tested end-to-end against the in-memory DB.
"""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.models.funding import FundingOpportunity
from app.schemas.funding import FundingOpportunityCreate, IngestionSummary
from app.services.funding_ingestion import run_ingestion
from app.services.funding_sources.grants_gov_client import GrantsGovClient
from app.services.funding_sources.nih_reporter_client import NIHReporterClient
from app.services.funding_sources.normalizer import normalize_opportunity

# ── In-memory SQLite engine shared across all tests ───────────────────────────
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
)
TestSession = sessionmaker(bind=TEST_ENGINE, autocommit=False, autoflush=False)


@pytest.fixture(autouse=True)
def reset_db():
    """Drop and recreate all tables before each test for full isolation."""
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture()
def db() -> Session:
    """Provide a test database session."""
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


# ── Sample raw dicts ──────────────────────────────────────────────────────────

def _nih_raw(
    *,
    appl_id: str = "12345678",
    title: str = "AI-Driven Healthcare Research",
    org: str = "MIT",
    abstract: str | None = "Research abstract text",
    amount: float | None = 500000.0,
    deadline: str | None = "2026-12-31",
    keywords: list[str] | None = None,
) -> dict:
    """Factory for a minimal NIH-shaped raw dict."""
    return {
        "external_id": appl_id,
        "title": title,
        "organization": org,
        "description": abstract,
        "funding_amount": amount,
        "currency": "USD",
        "deadline": deadline,
        "keywords": keywords or ["artificial intelligence", "healthcare"],
        "research_areas": ["Biomedical Technology"],
        "source_url": f"https://reporter.nih.gov/project-details/{appl_id}",
        "application_url": f"https://reporter.nih.gov/project-details/{appl_id}",
        "funding_type": "grant",
        "country": "US",
        "_source": "nih_reporter",
    }


def _grants_gov_raw(
    *,
    opp_id: str = "GG-99001",
    title: str = "NSF Machine Learning Innovation Grant",
    org: str = "National Science Foundation",
    description: str | None = "Support for ML innovation",
    amount: float | None = 250000.0,
    deadline: str | None = "09/30/2026",  # MM/DD/YYYY — Grants.gov format
    status: str = "active",
) -> dict:
    return {
        "external_id": opp_id,
        "title": title,
        "organization": org,
        "description": description,
        "funding_amount": amount,
        "currency": "USD",
        "deadline": deadline,
        "keywords": ["Machine Learning", "Innovation"],
        "research_areas": ["Computer Science"],
        "eligibility": "Universities, Non-profits",
        "source_url": f"https://www.grants.gov/web/grants/view-opportunity.html?oppId={opp_id}",
        "application_url": f"https://www.grants.gov/web/grants/view-opportunity.html?oppId={opp_id}",
        "funding_type": "grant",
        "country": "US",
        "status": status,
        "_source": "grants_gov",
    }


# ══════════════════════════════════════════════════════════════════════════════
# TC-01  Successful NIH source response → normalized FundingOpportunity record
# ══════════════════════════════════════════════════════════════════════════════

def test_tc01_nih_raw_normalizes_to_valid_record():
    """A well-formed NIH raw dict should produce a valid FundingOpportunityCreate."""
    raw = _nih_raw()
    result = normalize_opportunity(raw, "nih_reporter")

    assert result is not None, "Normalizer returned None for a valid NIH record"
    assert isinstance(result, FundingOpportunityCreate)
    assert result.external_id == "12345678"
    assert result.title == "AI-Driven Healthcare Research"
    assert result.organization == "MIT"
    assert result.source == "nih_reporter"
    assert result.funding_type == "grant"
    assert result.currency == "USD"
    assert result.country == "US"
    assert "artificial intelligence" in result.keywords
    assert result.funding_amount == 500000.0


# ══════════════════════════════════════════════════════════════════════════════
# TC-02  Missing optional fields do not crash ingestion
# ══════════════════════════════════════════════════════════════════════════════

def test_tc02_missing_optional_fields_accepted():
    """Records with no abstract, amount, or deadline must still be accepted."""
    raw = _nih_raw(abstract=None, amount=None, deadline=None)
    result = normalize_opportunity(raw, "nih_reporter")

    assert result is not None, "Normalizer should accept records with optional fields missing"
    assert result.description is None
    assert result.funding_amount is None
    assert result.deadline is None


def test_tc02_missing_keywords_default_empty_list():
    """Missing keywords should default to an empty list, not crash."""
    raw = _nih_raw()
    raw["keywords"] = None
    result = normalize_opportunity(raw, "nih_reporter")

    assert result is not None
    assert result.keywords == []


# ══════════════════════════════════════════════════════════════════════════════
# TC-03  Duplicate external_id is NOT inserted twice
# ══════════════════════════════════════════════════════════════════════════════

def test_tc03_duplicate_not_inserted_twice(db: Session):
    """Inserting the same external_id+source twice should produce only 1 DB row."""
    client = NIHReporterClient()
    raw = _nih_raw()

    async def _run():
        with patch.object(client, "fetch", new=AsyncMock(return_value=[raw])):
            s1 = await run_ingestion(db, client, ["AI"], limit=10)
            s2 = await run_ingestion(db, client, ["AI"], limit=10)
        return s1, s2

    s1, s2 = asyncio.get_event_loop().run_until_complete(_run())

    assert s1.inserted == 1
    assert s2.inserted == 0
    assert s2.skipped_duplicates == 1

    rows = db.query(FundingOpportunity).all()
    assert len(rows) == 1, "Only one row should exist after two identical syncs"


# ══════════════════════════════════════════════════════════════════════════════
# TC-04  Changed deadline on re-sync updates the existing record
# ══════════════════════════════════════════════════════════════════════════════

def test_tc04_changed_deadline_updates_existing_record(db: Session):
    """Re-syncing with a new deadline should UPDATE the existing row, not insert."""
    client = NIHReporterClient()
    raw_v1 = _nih_raw(deadline="2026-06-30")
    raw_v2 = _nih_raw(deadline="2026-12-31")  # same external_id, new deadline

    async def _run():
        with patch.object(client, "fetch", new=AsyncMock(return_value=[raw_v1])):
            s1 = await run_ingestion(db, client, ["AI"], limit=10)
        with patch.object(client, "fetch", new=AsyncMock(return_value=[raw_v2])):
            s2 = await run_ingestion(db, client, ["AI"], limit=10)
        return s1, s2

    s1, s2 = asyncio.get_event_loop().run_until_complete(_run())

    assert s1.inserted == 1
    assert s2.updated == 1
    assert s2.inserted == 0

    rows = db.query(FundingOpportunity).all()
    assert len(rows) == 1
    assert rows[0].deadline is not None
    assert rows[0].deadline.year == 2026
    assert rows[0].deadline.month == 12


# ══════════════════════════════════════════════════════════════════════════════
# TC-05  Malformed source response is caught; pipeline continues
# ══════════════════════════════════════════════════════════════════════════════

def test_tc05_malformed_record_skipped_pipeline_continues(db: Session):
    """
    A record missing the required `title` field should be skipped and counted
    in skipped_malformed, while other valid records in the same batch continue.
    """
    client = NIHReporterClient()
    good_raw = _nih_raw(appl_id="GOOD001")
    bad_raw = {
        "external_id": "BAD001",
        "title": "",          # Empty title — required field
        "organization": "Unknown",
        "_source": "nih_reporter",
    }

    async def _run():
        with patch.object(
            client, "fetch", new=AsyncMock(return_value=[bad_raw, good_raw])
        ):
            return await run_ingestion(db, client, ["AI"], limit=10)

    summary = asyncio.get_event_loop().run_until_complete(_run())

    assert summary.skipped_malformed == 1
    assert summary.inserted == 1  # good record was processed

    rows = db.query(FundingOpportunity).all()
    assert len(rows) == 1
    assert rows[0].external_id == "GOOD001"


# ══════════════════════════════════════════════════════════════════════════════
# TC-06  Expired / closed status is handled correctly
# ══════════════════════════════════════════════════════════════════════════════

def test_tc06_expired_status_stored_correctly():
    """The normalizer must map 'archived' → 'expired' and 'closed' → 'closed'."""
    raw_expired = _grants_gov_raw(status="archived")
    result_expired = normalize_opportunity(raw_expired, "grants_gov")
    assert result_expired is not None
    assert result_expired.status == "expired"

    raw_closed = _grants_gov_raw(status="closed", opp_id="GG-CLOSED")
    result_closed = normalize_opportunity(raw_closed, "grants_gov")
    assert result_closed is not None
    assert result_closed.status == "closed"

    raw_active = _grants_gov_raw(status="posted", opp_id="GG-ACTIVE")
    result_active = normalize_opportunity(raw_active, "grants_gov")
    assert result_active is not None
    assert result_active.status == "active"


# ══════════════════════════════════════════════════════════════════════════════
# TC-07  Grants.gov source response → normalized record
# ══════════════════════════════════════════════════════════════════════════════

def test_tc07_grants_gov_raw_normalizes_correctly():
    """A well-formed Grants.gov raw dict should produce a valid record."""
    raw = _grants_gov_raw()
    result = normalize_opportunity(raw, "grants_gov")

    assert result is not None
    assert result.external_id == "GG-99001"
    assert result.source == "grants_gov"
    assert result.organization == "National Science Foundation"
    assert result.funding_amount == 250000.0
    assert result.eligibility == "Universities, Non-profits"
    assert "Machine Learning" in result.keywords


# ══════════════════════════════════════════════════════════════════════════════
# TC-08  Normalizer correctly parses US-style date (MM/DD/YYYY)
# ══════════════════════════════════════════════════════════════════════════════

def test_tc08_us_date_format_parsed():
    """MM/DD/YYYY deadline (Grants.gov format) should parse to a UTC datetime."""
    raw = _grants_gov_raw(deadline="09/30/2026")
    result = normalize_opportunity(raw, "grants_gov")

    assert result is not None
    assert result.deadline is not None
    assert result.deadline.month == 9
    assert result.deadline.day == 30
    assert result.deadline.year == 2026
    assert result.deadline.tzinfo is not None  # must be timezone-aware


# ══════════════════════════════════════════════════════════════════════════════
# TC-09  Normalizer correctly parses ISO-8601 date
# ══════════════════════════════════════════════════════════════════════════════

def test_tc09_iso8601_date_parsed():
    """YYYY-MM-DD deadline (NIH format) should parse to a UTC datetime."""
    raw = _nih_raw(deadline="2026-12-31")
    result = normalize_opportunity(raw, "nih_reporter")

    assert result is not None
    assert result.deadline is not None
    assert result.deadline.year == 2026
    assert result.deadline.month == 12
    assert result.deadline.day == 31
    assert result.deadline.tzinfo is not None


# ══════════════════════════════════════════════════════════════════════════════
# TC-10  Network failure returns []; pipeline records 0 fetched
# ══════════════════════════════════════════════════════════════════════════════

def test_tc10_network_failure_returns_empty_summary(db: Session):
    """
    When the source client fails to fetch (network error), the ingestion
    service should return a summary with fetched=0 and no DB writes.
    """
    import httpx

    client = NIHReporterClient()

    # Simulate the connector returning [] due to network failure
    async def failing_fetch(keywords, limit):
        return []  # Client catches the error internally and returns []

    async def _run():
        with patch.object(client, "fetch", new=AsyncMock(side_effect=failing_fetch)):
            return await run_ingestion(db, client, ["AI"], limit=10)

    summary = asyncio.get_event_loop().run_until_complete(_run())

    assert summary.fetched == 0
    assert summary.inserted == 0
    assert db.query(FundingOpportunity).count() == 0


# ══════════════════════════════════════════════════════════════════════════════
# TC-11  Schema completeness — FundingOpportunityRead has all required fields
# ══════════════════════════════════════════════════════════════════════════════

def test_tc11_read_schema_has_all_required_fields(db: Session):
    """
    After insertion, a FundingOpportunityRead constructed from the DB row
    must contain all fields defined in the integration contract.
    """
    from app.schemas.funding import FundingOpportunityRead

    record = FundingOpportunity(
        external_id="SCHEMA-TEST-001",
        source="nih_reporter",
        title="Test Schema Grant",
        organization="Test University",
        description="A test.",
        funding_amount=100000,
        currency="USD",
        deadline=datetime(2027, 1, 1, tzinfo=timezone.utc),
        eligibility="All researchers",
        research_areas=["AI"],
        keywords=["test"],
        funding_type="grant",
        country="US",
        source_url="https://example.com",
        application_url="https://example.com/apply",
        status="active",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    read = FundingOpportunityRead.model_validate(record)

    required_fields = [
        "id", "external_id", "title", "organization", "description",
        "funding_amount", "currency", "deadline", "eligibility",
        "research_areas", "keywords", "funding_type", "country",
        "source", "source_url", "application_url", "status",
        "created_at", "updated_at",
    ]
    for field in required_fields:
        assert hasattr(read, field), f"FundingOpportunityRead is missing field: {field!r}"


# ══════════════════════════════════════════════════════════════════════════════
# TC-12  Re-sync with identical data → duplicate (no second DB row)
# ══════════════════════════════════════════════════════════════════════════════

def test_tc12_identical_resync_no_duplicate_row(db: Session):
    """
    Running the sync job twice with the same source data must not create a
    second database row and must report it as a skipped duplicate.
    """
    client = GrantsGovClient()
    raw = _grants_gov_raw()

    async def _run():
        with patch.object(client, "fetch", new=AsyncMock(return_value=[raw])):
            s1 = await run_ingestion(db, client, ["ML"], limit=10)
        with patch.object(client, "fetch", new=AsyncMock(return_value=[raw])):
            s2 = await run_ingestion(db, client, ["ML"], limit=10)
        return s1, s2

    s1, s2 = asyncio.get_event_loop().run_until_complete(_run())

    assert s1.inserted == 1, "First run should insert 1 record"
    assert s2.inserted == 0, "Second run should insert 0 records"
    assert s2.skipped_duplicates == 1

    assert db.query(FundingOpportunity).count() == 1, "DB must have exactly 1 row"
