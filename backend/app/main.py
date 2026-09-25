"""
backend/app/main.py
FastAPI application factory for the Research Funding & Innovation Intelligence Platform.
Registers all module routers:
- Module 1: Auth & RBAC
- Module 2: Research Profile Management
- Module 3: Research Paper Intelligence
- Module 4: Funding Opportunities Ingestion
- Module 6: Technology Intelligence (Sadashiv)
- Module 7: Multi-factor Evaluation (Member 4)
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.init_db import init_db

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="Research Funding & Innovation Intelligence Platform",
    version="0.2.0",
    description="Authentication, research profiles, paper intelligence, funding, and technology intelligence.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Dynamic CORS Configuration ────────────────────────────────────────────────
cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
for origin in [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]:
    if origin not in cors_origins:
        cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()
    # Seed demo technology data if the database is empty
    _seed_demo_data()


def _seed_demo_data() -> None:
    """Auto-seed demo technologies on first startup for Module 6."""
    from app.db.session import SessionLocal
    from app.models.technology import Technology
    db = SessionLocal()
    try:
        count = db.query(Technology).count()
        if count == 0:
            from app.db.seed_technology import seed_demo_technologies
            n = seed_demo_technologies(db)
            logger.info("Module 6: Auto-seeded %d demo technologies", n)
    except Exception as e:
        logger.error("Module 6: seed failed: %s", e)
    finally:
        db.close()


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "message": "Research Funding & Innovation Intelligence Platform API",
        "status": "ok",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "backend",
    }


# ── Module 1 & 2 Routers (Auth, Users, Profile, Records) ──────────────────────
try:
    from app.routers import auth, profile, records, users
    # Support both direct (/auth, /users, etc.) and /api prefixes
    app.include_router(auth.router)
    app.include_router(auth.router, prefix="/api")
    app.include_router(users.router)
    app.include_router(users.router, prefix="/api")
    app.include_router(profile.router)
    app.include_router(profile.router, prefix="/api")
    if hasattr(records, "publications"):
        app.include_router(records.publications)
        app.include_router(records.publications, prefix="/api")
    if hasattr(records, "patents"):
        app.include_router(records.patents)
        app.include_router(records.patents, prefix="/api")
except Exception as e:
    logger.warning("Could not mount auth/profile routers: %s", e)

# ── Module 3 Router (Research Papers) ──────────────────────────────────────────
try:
    from app.routers import research_papers
    app.include_router(research_papers.router, prefix="/api")
    app.include_router(research_papers.router)
except Exception as e:
    logger.warning("Could not mount research_papers router: %s", e)

# ── Module 4 Router (Funding Data Ingestion) ───────────────────────────────────
try:
    from app.routers import funding
    app.include_router(funding.router, prefix="/api/funding", tags=["Funding"])
    app.include_router(funding.router, prefix="/funding", tags=["Funding"])
except Exception as e:
    logger.warning("Could not mount funding router: %s", e)

# ── Module 7 Router (Member 4 Multi-Factor Evaluation) ─────────────────────────
try:
    from app.routers import module7_member4
    app.include_router(module7_member4.router, prefix="/api", tags=["Module 7 - Member 4"])
    app.include_router(module7_member4.router, tags=["Module 7 - Member 4"])
except Exception as e:
    logger.warning("Could not mount module7_member4 router: %s", e)

# ── Module 6 Routers (Technology Intelligence - Sadashiv) ─────────────────────
try:
    from app.routers import technologies
    app.include_router(technologies.router, prefix="/api")
    app.include_router(technologies.router)
    app.include_router(technologies.opportunities_router, prefix="/api")
    app.include_router(technologies.opportunities_router)
except Exception as e:
    logger.warning("Could not mount technology intelligence routers: %s", e)
