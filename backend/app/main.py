from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.init_db import init_db

from app.routers import auth, profile, records, users
from app.routers import research_papers
from app.routers import funding as funding_router
from app.routers import patent_landscape as patent_landscape_router

settings = get_settings()

app = FastAPI(
    title="Research Funding & Innovation Intelligence Platform",
    version="0.3.0",
    description=(
        "Research intelligence and funding opportunity discovery platform. "
        "Modules: Authentication (M1), Research Profile (M2), "
        "Research Intelligence (M3), Funding Discovery (M4), "
        "Patent Landscape Analysis (M5)."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/", tags=["Health"])
def read_root():
    return {
        "message": "Research Funding & Innovation Intelligence Platform API",
        "version": "0.3.0",
        "status": "ok",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "backend"}


# ─── Module 1 — Authentication ───────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(auth.router, prefix="/api")

# ─── Module 1/2 — Users & Profile ────────────────────────────────────────────
app.include_router(users.router)
app.include_router(users.router, prefix="/api")

app.include_router(profile.router)
app.include_router(profile.router, prefix="/api")

app.include_router(records.publications)
app.include_router(records.publications, prefix="/api")

app.include_router(records.patents)
app.include_router(records.patents, prefix="/api")

# ─── Module 3 — Research Intelligence ────────────────────────────────────────
app.include_router(research_papers.router)

# ─── Module 4 — Funding Discovery ────────────────────────────────────────────
app.include_router(funding_router.router)
app.include_router(funding_router.router, prefix="/api")

# ─── Module 5 — Patent Landscape Analysis ───────────────────────────────────
app.include_router(patent_landscape_router.router)
