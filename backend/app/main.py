"""
backend/app/main.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

FastAPI application factory.
- Registers all module routers
- Configures CORS (development: allow all origins)
- Adds a health-check endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()

# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Intelligent Research Platform API",
    description=(
        "AI-powered research funding, innovation, and publication intelligence."
    ),
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
# Module 4 funding router (Member 5 will also add endpoints here)
from app.routers import funding  # noqa: E402

app.include_router(funding.router, prefix="/api/funding", tags=["Funding"])

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "service": "intelligent-research-api"}
