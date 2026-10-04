"""
test_demo.py
--------------
Exercises the real API endpoints using FastAPI's TestClient - this sends
actual HTTP requests through the actual routing/validation layer, the
same code path a real client (Member 5's service, or Postman) would hit.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def show(label, response):
    print(f"\n=== {label} (status {response.status_code}) ===")
    print(response.json())


# 1. Research Novelty - complete data
show("Research Novelty: complete data", client.post("/api/innovation/research-novelty", json={
    "technology_id": "TECH001",
    "new_text": "novel sulfide-based solid electrolyte enabling fast charging in EV batteries",
    "existing_texts": [
        "solid state electrolyte for lithium metal batteries",
        "improving ionic conductivity in solid state batteries",
        "interface stability in solid state battery cells",
    ],
    "research_gap_evidence": 70,
    "emerging_topic_evidence": 85,
    "new_direction_evidence": 60,
}))

# 2. Research Novelty - Module 3 hasn't returned new_direction_evidence yet
show("Research Novelty: missing new_direction_evidence", client.post("/api/innovation/research-novelty", json={
    "technology_id": "TECH001",
    "new_text": "novel sulfide-based solid electrolyte enabling fast charging in EV batteries",
    "existing_texts": [
        "solid state electrolyte for lithium metal batteries",
        "improving ionic conductivity in solid state batteries",
    ],
    "research_gap_evidence": 70,
    "emerging_topic_evidence": 85,
}))

# 3. Patent Strength - complete data
show("Patent Strength: complete data", client.post("/api/innovation/patent-strength", json={
    "technology_id": "TECH001",
    "activity": 65,
    "growth": 54,
    "citations": 40,
    "family_breadth": 58,
    "coverage": 62,
    "competitor_activity": 45,
}))

# 4. Patent Strength - missing competitor_activity
show("Patent Strength: missing competitor_activity", client.post("/api/innovation/patent-strength", json={
    "technology_id": "TECH001",
    "activity": 65,
    "growth": 54,
    "citations": 40,
    "family_breadth": 58,
    "coverage": 62,
}))

# 5. Validation error - missing required technology_id
show("Validation error: missing technology_id", client.post("/api/innovation/patent-strength", json={
    "activity": 65,
}))
