# Module 3: AI Research Intelligence

Module 3 consumes the existing `Publication`, `ResearchProfile`, and `ResearchTag` tables. It does not create a second paper table, alter authentication, or implement funding functionality.

## APIs

All endpoints require the existing `Authorization: Bearer <access_token>` header. They operate on the authenticated researcher's publication corpus and profile.

- `POST /api/research/papers/{paper_id}/analyze`
- `GET /api/research/trends?start_year=2023&end_year=2025&keyword=vision`
- `GET /api/research/emerging-topics`
- `GET /api/research/insights`
- `GET /api/research/recommendations?limit=10`

Example analysis request:

```http
POST /api/research/papers/12/analyze
Authorization: Bearer <access_token>
```

The response separates `source` metadata from `ai_analysis`. Because the current `Publication` contract stores no abstract or full text, `source.content_basis` explicitly reports metadata-only analysis. The local provider never invents methodology or findings.

## Data and calculations

Trend counts and topic frequencies are calculated from authenticated publication rows. Topics come from comma/semicolon-separated keywords plus title tokens. Emerging topics compare the latest represented publication year with earlier years and use the wording `Observed growth`; this is an observation, not a scientific claim. Insights return source-derived metrics separately from constrained interpretation.

Recommendations read Module 2's `research_domain`, `research_areas`, and `research_keywords` values. Scores are transparent weighted matches: domain `0.25`, area `0.30`, and each of up to three keywords `0.15`, capped at `1.0`.

## Provider configuration

```env
AI_PROVIDER=local
AI_API_KEY=
AI_MODEL=metadata-heuristic-v1
AI_TIMEOUT_SECONDS=15
```

The default local provider is deterministic and requires no key. A future external provider can implement `AIProvider` without changing routes or corpus calculations. Provider exceptions are logged server-side and return a local fallback response.

## Development preview data

With the backend environment configured, run:

```powershell
$env:PYTHONPATH = "backend"
.\.venv\Scripts\python.exe backend\scripts\seed_demo_research.py
```

This creates a non-production demo account and four publications only when they do not already exist. Do not use the demo password outside local development.

## Integration notes

- Member 1: ingestion can populate the existing `Publication` fields; keywords should be comma-separated where possible.
- Member 2: this module consumes the existing publication/profile contracts and bearer auth. A richer paper source can later add abstract/full-text fields to that contract without changing the endpoint shape.
- Member 6: the protected React page is `/research-intelligence`; it consumes structured trends, insights, and recommendations and does not contain hardcoded research results.

Known limitation: without abstract/full-text fields, analysis is explicitly metadata-only and cannot make substantive claims about a paper's method or findings.