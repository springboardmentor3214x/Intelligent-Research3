# Member 3 — Research Novelty + Patent Strength (Python / FastAPI)

This is the corrected version, in the project's actual language (Python +
FastAPI, matching the tech stack in the original project spec), matching
the exact formulas from the Module 6 & 7 Implementation Guide.

## Run it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then open **http://localhost:8000/docs** — FastAPI auto-generates an
interactive page where you can test both endpoints directly in the
browser, no Postman needed.

To run the automated test instead:
```bash
python test_demo.py
```

## Folder structure

```
app/
  main.py                          -> FastAPI app, mounts the router
  routers/
    innovation_router.py           -> the two API endpoints
  schemas/
    innovation_schemas.py          -> request validation (Pydantic)
  services/
    normalization_service.py       -> shared 0-100 scaling
    semantic_service.py            -> text similarity (the "AI" piece)
    novelty_service.py             -> Research Novelty formula
    patent_strength_service.py     -> Patent Strength formula
test_demo.py                       -> end-to-end test using real HTTP calls
requirements.txt
```

## The two API endpoints

```
POST /api/innovation/research-novelty
POST /api/innovation/patent-strength
```

### Research Novelty — request body
```json
{
  "technology_id": "TECH001",
  "new_text": "abstract or description of the technology",
  "existing_texts": ["existing paper 1", "existing paper 2"],
  "research_gap_evidence": 70,
  "emerging_topic_evidence": 85,
  "new_direction_evidence": 60
}
```
`research_gap_evidence`, `emerging_topic_evidence`, and `new_direction_evidence`
are expected to come from Module 3 (Research Intelligence). They can be
omitted (`null`) if Module 3 hasn't returned them yet — the service will
recalculate using only the available indicators and flag the response as
`"calculated_with_adjusted_weights"`.

**Formula:**
```
score = distinctiveness × 0.35
      + research_gap_evidence × 0.25
      + emerging_topic_evidence × 0.20
      + new_direction_evidence × 0.20
```
`distinctiveness` is calculated internally from `new_text` vs `existing_texts`
using TF-IDF + cosine similarity (a lightweight stand-in for a real
embedding model — see the upgrade note inside `semantic_service.py`).

### Patent Strength — request body
```json
{
  "technology_id": "TECH001",
  "activity": 65,
  "growth": 54,
  "citations": 40,
  "family_breadth": 58,
  "coverage": 62,
  "competitor_activity": 45
}
```
All six values must already be normalized to 0–100 (use
`normalization_service.py` on Module 5's raw patent counts first).

**Formula:**
```
score = activity × 0.20 + growth × 0.20 + citations × 0.20
      + family_breadth × 0.15 + coverage × 0.15 + competitor_activity × 0.10
```

## Response shape (both endpoints)

```json
{
  "technology_id": "TECH001",
  "factor": "research_novelty",
  "score": 76.89,
  "status": "complete",
  "indicators": { "...": "each individual value used, for traceability" },
  "missing": []
}
```
`status` is one of: `"complete"`, `"calculated_with_adjusted_weights"`, or
`"insufficient_data"` — Member 5's dashboard can use this to show a
data-quality badge next to the score.

## What's still needed before production

1. Connect `research_gap_evidence`, `emerging_topic_evidence`, and
   `new_direction_evidence` to Module 3's real API instead of passing
   them in manually.
2. Connect the six patent indicators to Module 5's real patent data,
   normalized via `normalization_service.py`.
3. Optionally upgrade `semantic_service.py` to a real embedding model
   (Sentence Transformers) — the exact swap-in code is commented inside
   the file.
4. Add a `score_version` field to the response (e.g. `"novelty_v1"`) so
   Member 5 can track which methodology version produced each score,
   per the project's versioning requirement.
