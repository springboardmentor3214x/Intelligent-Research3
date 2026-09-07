# Module 3 — Research Data Ingestion

**Member 1 | Research Funding & Innovation Intelligence Platform**

---

## What This Module Does

Fetches research paper metadata from **OpenAlex** (a free, open-access research index), normalizes it, deduplicates it, and stores it in the `research_papers` PostgreSQL table.

Member 2 can then query this table to build search/filter/detail APIs.

---

## Why OpenAlex?

| Requirement | OpenAlex |
|---|---|
| Free & legal | ✅ No license restrictions |
| No API key required | ✅ Polite-pool e-mail optional |
| Rich metadata | ✅ Title, abstract, authors, DOI, keywords, concepts, OA URLs |
| High volume | ✅ 250M+ works indexed |
| REST API | ✅ `https://api.openalex.org/works` |

---

## Environment Variables

Add to your `.env` file:

```env
# Required (already present)
DATABASE_URL=postgresql://...

# Optional — enables OpenAlex polite pool (higher rate limits)
# Never required; OpenAlex is free with no API key
OPENALEX_MAILTO=your@email.com
```

---

## File Structure Created

```
backend/app/
├── models/
│   └── research_paper.py          # SQLAlchemy model (research_papers table)
├── schemas/
│   └── research_paper.py          # Pydantic schemas (In/Out/SyncSummary)
├── services/
│   ├── research_sources/
│   │   ├── __init__.py
│   │   ├── base.py                # Abstract source client interface
│   │   ├── openalex_client.py     # OpenAlex HTTP client
│   │   ├── normalizer.py          # OpenAlex → ResearchPaperCreate converter
│   │   └── sample_records.py     # Real-structure sample records (dev/tests)
│   ├── research_paper_repository.py  # DB CRUD (find/insert/update/upsert)
│   └── research_ingestion_service.py # Pipeline orchestrator
└── jobs/
    └── research_sync.py           # CLI sync entry point
```

---

## ResearchPaper Schema

| Field | Type | Notes |
|---|---|---|
| `id` | int | Auto-increment primary key |
| `external_id` | str \| None | OpenAlex work ID (e.g. `W2741809807`) |
| `source` | str | `"openalex"` (or future source name) |
| `title` | str | Required — records without title are skipped |
| `abstract` | str \| None | Reconstructed from OpenAlex inverted index |
| `doi` | str \| None | Raw DOI as received |
| `normalized_doi` | str \| None | Canonical `10.xxxx/...` form |
| `authors` | str | JSON list e.g. `["Alice", "Bob"]` |
| `publication_date` | date \| None | ISO-8601 date |
| `publication_year` | int \| None | Indexed for filtering |
| `journal` | str \| None | From OpenAlex `primary_location.source` |
| `keywords` | str | JSON list |
| `research_area` | str | JSON list (from OpenAlex concepts) |
| `source_url` | str \| None | Landing page URL |
| `open_access_url` | str \| None | PDF / OA URL |
| `title_fingerprint` | str \| None | For fallback duplicate detection |
| `first_author_fingerprint` | str \| None | For fallback duplicate detection |
| `created_at` | datetime | Auto |
| `updated_at` | datetime | Auto-updated on upsert |

---

## Duplicate Handling Strategy

```
New record arrives
        │
        ▼
DOI present?
  YES ──► normalize_doi() ──► find_by_normalized_doi()
           found? → UPDATE    not found? → continue
        │
        ▼
external_id present?
  YES ──► find_by_source_external_id()
           found? → UPDATE    not found? → continue
        │
        ▼
Fallback: title_fingerprint + first_author_fingerprint + publication_year
           found? → UPDATE    not found? → INSERT
```

**Database-level constraints** (`UNIQUE` on `normalized_doi` and on `(source, external_id)`) provide an additional safety net at the DB level.

---

## How to Run the Sync

From the `backend/` directory:

```bash
# Basic — fetch 1 page of 25 results
python -m app.jobs.research_sync --query "machine learning healthcare"

# Fetch 2 pages of 50 results each
python -m app.jobs.research_sync --query "climate change" --pages 2 --per-page 50

# Start from page 3
python -m app.jobs.research_sync --query "cancer immunotherapy" --page 3 --per-page 25
```

### Example Output

```json
{
  "fetched": 25,
  "inserted": 18,
  "updated": 5,
  "skipped_duplicates": 0,
  "failed": 2
}
```

The sync is **idempotent** — running it twice with the same query updates existing records instead of creating duplicates.

---

## How the Table Is Created

The `research_papers` table is created automatically by `init_db()` on server startup (same as all other tables — no separate Alembic migration needed for this project's `create_all()` setup).

If you want to create it manually:
```bash
python -c "from app.db.init_db import init_db; init_db()"
```

---

## How to Run Tests

From the `backend/` directory:

```bash
# Run only Module 3 tests
python -m pytest test_module3_ingestion.py -v

# Run all tests
python -m pytest -v
```

Tests use SQLite in-memory — **no live database or API connection required**.

---

## What Member 2 Needs

Member 2 can consume the `research_papers` table directly via SQLAlchemy:

```python
from app.db.session import get_db
from app.models.research_paper import ResearchPaper

# In a FastAPI dependency or service:
papers = db.query(ResearchPaper).filter(
    ResearchPaper.publication_year >= 2020
).order_by(ResearchPaper.created_at.desc()).all()
```

Or import the Pydantic output schema:
```python
from app.schemas.research_paper import ResearchPaperOut
```

The `get_authors()`, `get_keywords()`, `get_research_area()` methods on the ORM model decode the JSON text columns to Python lists.

---

## Adding a New Research Source

1. Create `backend/app/services/research_sources/new_source_client.py`
2. Inherit from `BaseResearchSourceClient` and implement `source_name` + `search()`
3. Create a corresponding normalizer or extend `OpenAlexNormalizer`
4. Pass the new client to `ResearchIngestionService(client=NewSourceClient())`
