"""
app/main.py
-------------
Entry point. Run with:  uvicorn app.main:app --reload --port 8000
Then visit http://localhost:8000/docs for interactive API testing (FastAPI
auto-generates this - one of the main advantages of using FastAPI here).
"""

from fastapi import FastAPI
from app.routers.innovation_router import router as innovation_router

app = FastAPI(title="Module 7 - Member 3 Service (Research Novelty + Patent Strength)")

app.include_router(innovation_router)


@app.get("/health")
def health():
    return {"status": "ok"}
