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

    # Ensure quick-login accounts exist (admin & researcher)
    try:
        from app.db.session import SessionLocal
        from app.models.user import User, RoleEnum
        from app.core.security import get_password_hash
        _db = SessionLocal()
        _admin = _db.query(User).filter(User.email == "admin@research.org").first()
        if not _admin:
            _admin = User(
                name="System Administrator",
                email="admin@research.org",
                password_hash=get_password_hash("Password123!"),
                role=RoleEnum.ADMINISTRATOR.value,
                is_active=True,
                organization="Research Platform",
                designation="Platform Admin",
            )
            _db.add(_admin)
        _res = _db.query(User).filter(User.email == "researcher@research.org").first()
        if not _res:
            _res = User(
                name="Dr. Alex Rivera",
                email="researcher@research.org",
                password_hash=get_password_hash("Password123!"),
                role=RoleEnum.RESEARCHER.value,
                is_active=True,
                organization="Quantum & AI Labs",
                designation="Lead Researcher",
            )
            _db.add(_res)
        _db.commit()
        _db.close()
    except Exception as _e:
        logger.warning(f"Could not initialize demo accounts: {_e}")

    # Trigger real-time technology data ingestion in background (no demo data)
    import asyncio, threading

    def _run_initial_sync():
        """Run real-time sync for popular technologies on first startup."""
        from app.db.session import SessionLocal
        from app.models.technology import Technology
        from app.services.technology_sync_service import sync_technology

        db = SessionLocal()
        try:
            count = db.query(Technology).count()
            if count == 0:
                logger.info("Module 6: No technologies found — starting real-time data ingestion...")
                # Default set of technologies to pre-fetch from OpenAlex
                DEFAULT_TECHNOLOGIES = [
                    ("Quantum Computing", "Quantum Technology"),
                    ("Large Language Models", "Artificial Intelligence"),
                    ("CRISPR Gene Editing", "Biotechnology"),
                    ("Solid State Battery", "Clean Energy"),
                    ("Edge AI", "Artificial Intelligence"),
                    ("Blockchain", "Distributed Systems"),
                    ("5G Networks", "Telecommunications"),
                    ("Autonomous Vehicles", "Robotics & Automation"),
                ]
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                for tech_name, domain in DEFAULT_TECHNOLOGIES:
                    try:
                        result = loop.run_until_complete(
                            sync_technology(db, tech_name, domain=domain, use_demo_fallback=False)
                        )
                        logger.info(
                            "Module 6: Synced '%s' — stage=%s, papers=%s",
                            tech_name,
                            result.get("stage"),
                            result.get("research_papers_total"),
                        )
                    except Exception as e:
                        logger.error("Module 6: Sync failed for '%s': %s", tech_name, e)
                loop.close()
            else:
                logger.info("Module 6: %d technologies already in DB — skipping initial sync", count)
        except Exception as e:
            logger.error("Module 6: Initial sync error: %s", e)
        finally:
            db.close()

    thread = threading.Thread(target=_run_initial_sync, daemon=True, name="tech-init-sync")
    thread.start()
    logger.info("Module 6: Real-time technology sync thread started")


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

# ── Module 6 Routers (Technology Intelligence - Sadashiv) ─────────────────────
try:
    from app.routers import technologies
    app.include_router(technologies.router, prefix="/api")
    app.include_router(technologies.opportunities_router, prefix="/api")
except Exception as e:
    logger.warning("Could not mount technology intelligence routers: %s", e)

# ── Module 7 Routers ───────────────────────────────────────────────────────────
try:
    from app.routers import module7_member4
    app.include_router(module7_member4.router, prefix="/api", tags=["Module 7 - Member 4"])
    app.include_router(module7_member4.router, tags=["Module 7 - Member 4"])
except Exception as e:
    logger.warning("Could not mount module7_member4 router: %s", e)

try:
    from app.routers import module7_member5
    app.include_router(module7_member5.router, tags=["Module 7 - Innovation Scoring"])
except Exception as e:
    logger.warning("Could not mount module7_member5 router: %s", e)

try:
    from app.routers import innovation_router
    app.include_router(innovation_router.router, tags=["Module 7 - Research Novelty & Patent Strength"])
except Exception as e:
    logger.warning("Could not mount innovation_router: %s", e)

# ── Module 7 Master Innovation Scoring Router ──────────────────────────────────
try:
    from app.routers import innovation_score_engine
    app.include_router(innovation_score_engine.router, prefix="/api", tags=["Module 7 - Innovation Scoring Engine"])
    app.include_router(innovation_score_engine.router, tags=["Module 7 - Innovation Scoring Engine"])
except Exception as e:
    logger.warning("Could not mount innovation_score_engine router: %s", e)

# ── Module 8 Commercialization Recommendation Router ───────────────────────────
try:
    from app.routers import commercialization_engine
    app.include_router(commercialization_engine.router, prefix="/api", tags=["Module 8 - Commercialization Recommendation Engine"])
    app.include_router(commercialization_engine.router, tags=["Module 8 - Commercialization Recommendation Engine"])
except Exception as e:
    logger.warning("Could not mount commercialization_engine router: %s", e)

# ── Module 9 Dashboard & Analytics Router ──────────────────────────────────────
try:
    from app.routers import dashboard
    app.include_router(dashboard.router, prefix="/api", tags=["Module 9 - Dashboard & Analytics"])
    logger.info("Module 9: Dashboard & Analytics router mounted at /api/dashboard")
except Exception as e:
    logger.warning("Could not mount dashboard router: %s", e)

