# Backend — Intelligent Research Platform API

> **Author:** Kaviya (Member 4 — Module 4: Funding Data Ingestion)  
> **Branch:** `kaviya`  
> **Stack:** FastAPI · SQLAlchemy 2 · Alembic · httpx · Pydantic v2

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL (or skip for SQLite local dev — see below)

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — for local dev, the SQLite default works without changes
```

**Key variables:**

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./intelliresearch.db` | DB connection string |
| `NIH_REPORTER_BASE_URL` | `https://api.reporter.nih.gov/v2` | NIH RePORTER API base |
| `GRANTS_GOV_BASE_URL` | `https://apply07.grants.gov/grantsws` | Grants.gov API base |
| `FUNDING_SYNC_DEFAULT_LIMIT` | `50` | Records per source per sync |

### 4. Run database migration

```bash
cd backend
alembic upgrade head
```

This creates the `funding_opportunities` table with all indexes and constraints.

### 5. Run the funding sync job

```bash
# Both sources, default keywords, 50 records each
python -m app.jobs.funding_sync

# Custom keywords
python -m app.jobs.funding_sync --keywords "AI healthcare" "machine learning"

# Limit records
python -m app.jobs.funding_sync --limit 100

# Only NIH RePORTER
python -m app.jobs.funding_sync --sources nih

# Only Grants.gov
python -m app.jobs.funding_sync --sources grants
```

**Example output:**
```
────────────────────────────────────────────────────────────────────────
              Funding Sync Report
────────────────────────────────────────────────────────────────────────
Source               Fetched  Inserted   Updated  Dup skip  Malformed
────────────────────────────────────────────────────────────────────────
nih_reporter              47        45         2         0          0
grants_gov                38        37         1         0          0
────────────────────────────────────────────────────────────────────────
TOTAL                               82         3
────────────────────────────────────────────────────────────────────────
Elapsed: 4.2s   Status: ✓ OK
```

### 6. Start the API server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Docs available at: http://localhost:8000/docs

---

## Running Tests

```bash
cd backend
pytest tests/test_funding_ingestion.py -v
```

Tests use an **in-memory SQLite database** — no PostgreSQL or network access needed.

**Test coverage:**

| Test | What it verifies |
|---|---|
| TC-01 | NIH raw response → valid normalized record |
| TC-02 | Missing optional fields (abstract, amount, deadline) don't crash |
| TC-03 | Same external_id is NOT inserted twice |
| TC-04 | Changed deadline on re-sync updates existing row |
| TC-05 | Malformed record skipped; batch continues |
| TC-06 | Expired/closed status correctly mapped |
| TC-07 | Grants.gov raw response → valid normalized record |
| TC-08 | US date format (MM/DD/YYYY) parsed correctly |
| TC-09 | ISO-8601 date parsed correctly |
| TC-10 | Network failure → 0 fetched, 0 DB writes |
| TC-11 | FundingOpportunityRead contains all contract fields |
| TC-12 | Identical re-sync → skipped_duplicate (no second row) |

---

## File Structure

```
backend/
├── requirements.txt
├── .env.example
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_create_funding_opportunity.py
└── app/
    ├── __init__.py
    ├── main.py              ← FastAPI app factory
    ├── config.py            ← Settings (pydantic-settings)
    ├── database.py          ← Engine, SessionLocal, Base
    ├── models/
    │   └── funding.py       ← FundingOpportunity ORM model
    ├── schemas/
    │   └── funding.py       ← Pydantic v2 schemas
    ├── services/
    │   ├── funding_ingestion.py        ← Orchestrator (upsert logic)
    │   └── funding_sources/
    │       ├── base.py                 ← Abstract source client
    │       ├── nih_reporter_client.py  ← NIH RePORTER connector
    │       ├── grants_gov_client.py    ← Grants.gov connector
    │       └── normalizer.py          ← Raw → FundingOpportunityCreate
    ├── routers/
    │   └── funding.py       ← API stub (Member 5 fills in)
    └── jobs/
        └── funding_sync.py  ← CLI sync job
tests/
└── test_funding_ingestion.py
```

---

## Data Sources

### NIH RePORTER
- **URL:** https://api.reporter.nih.gov/v2
- **Endpoint:** `POST /projects/search`
- **License:** US public domain — no API key required
- **Rate limits:** ~1 req/s; tenacity handles retries

### Grants.gov
- **URL:** https://apply07.grants.gov/grantsws
- **Endpoint:** `POST /rest/opportunities/search`
- **License:** US public domain — no API key required
- **Rate limits:** handled with tenacity retry

---

## FundingOpportunity Data Contract

Full schema agreed with Members 5 & 6:

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `id` | int | No | Auto-increment PK |
| `external_id` | str(512) | No | Source-specific ID |
| `title` | str(1024) | No | Grant title |
| `organization` | str(512) | No | Funder name |
| `description` | text | Yes | Abstract / synopsis |
| `funding_amount` | Decimal(18,2) | Yes | Award amount |
| `currency` | str(8) | No | ISO-4217, default USD |
| `deadline` | datetime(tz) | Yes | UTC application deadline |
| `eligibility` | text | Yes | Eligibility criteria |
| `research_areas` | JSON list | No | Normalised area labels |
| `keywords` | JSON list | No | Source keywords |
| `funding_type` | str(64) | No | grant/fellowship/contract/other |
| `country` | str(4) | No | ISO-3166-1, default US |
| `source` | str(64) | No | nih_reporter / grants_gov |
| `source_url` | str(2048) | Yes | Source record URL |
| `application_url` | str(2048) | Yes | Application URL |
| `status` | str(16) | No | active / expired / closed |
| `created_at` | datetime(tz) | No | First ingestion |
| `updated_at` | datetime(tz) | No | Last sync update |

**Deduplication constraint:** `UNIQUE(external_id, source)`  
**Fallback dedup:** `title + organization + deadline_date` (within same source)

---

## Member 5 Handoff Notes

Member 5 (Module 4: Search / DB / FastAPI) should:

1. Run `alembic upgrade head` to apply the migration
2. Run the sync job to populate the database
3. Import `FundingOpportunity` from `app.models.funding`
4. Use `FundingOpportunityRead` / `FundingOpportunityListResponse` schemas
5. Build the full list, search, filter, saved-funding, and recommendations endpoints
6. Add authentication using the Module 1 mechanism
7. The router stub at `app/routers/funding.py` has the route signatures — fill them in

**API endpoint contract (for Member 5 to implement):**

```
GET  /api/funding                   → FundingOpportunityListResponse
GET  /api/funding/{id}              → FundingOpportunityRead
POST /api/funding/search            → FundingOpportunityListResponse
GET  /api/funding/recommendations   → FundingOpportunityListResponse
POST /api/funding/save              → { message: str }
GET  /api/funding/saved             → FundingOpportunityListResponse
DELETE /api/funding/saved/{id}      → { message: str }
```

**Agreed pagination shape:**
```json
{
  "items": [...],
  "page": 1,
  "page_size": 20,
  "total": 125
}
```

**Agreed error shape:**
```json
{
  "detail": "Funding opportunity not found."
}
```
HTTP 404 for unknown ID, HTTP 422 for invalid filter values, HTTP 401 for unauthenticated user-specific endpoints.
