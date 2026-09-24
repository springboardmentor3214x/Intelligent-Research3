"""
backend/app/main.py
FastAPI application factory.
- Registers all module routers
- Configures CORS (development: allow all origins)
- Adds a health-check endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.config import get_settings
    settings = get_settings()
except Exception:
    pass

app = FastAPI(
    title="Intelligent Research Platform API",
    description="AI-powered research funding, innovation, and publication intelligence.",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "message": "Research Funding & Innovation Intelligence Platform API",
        "status": "ok",
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "intelligent-research-api"}

# ── Routers ───────────────────────────────────────────────────────────────────
# Module 1 / 2 / 3 routers (if available)
try:
    from app.routers import auth, profile, records, users
    app.include_router(auth.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(profile.router, prefix="/api")
    if hasattr(records, 'publications'):
        app.include_router(records.publications, prefix="/api")
    if hasattr(records, 'patents'):
        app.include_router(records.patents, prefix="/api")
except Exception:
    pass

try:
    from app.routers import research_papers
    app.include_router(research_papers.router, prefix="/api")
except Exception:
    pass

# Module 4 & Module 7 Member 4 routers
try:
    from app.routers import funding
    app.include_router(funding.router, prefix="/api/funding", tags=["Funding"])
except Exception:
    pass

try:
    from app.routers import module7_member4
    app.include_router(module7_member4.router, prefix="/api", tags=["Module 7 - Member 4"])
except Exception:
    pass
