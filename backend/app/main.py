from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.init_db import init_db

from app.routers import auth, profile, records, users
from app.routers import auth, profile, records, users, research_papers


settings = get_settings()

app = FastAPI(
    title="Research Funding & Innovation Intelligence Platform",
    version="0.2.0",
    description="Authentication and research profile management API.",
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


@app.get("/")
def read_root():
    return {
        "message": "Research Funding & Innovation Intelligence Platform API",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "backend",
    }


# Register routers
app.include_router(auth.router)
app.include_router(auth.router, prefix="/api")

app.include_router(users.router)
app.include_router(users.router, prefix="/api")

app.include_router(profile.router)
app.include_router(profile.router, prefix="/api")

app.include_router(records.publications)
app.include_router(records.publications, prefix="/api")

app.include_router(records.patents)
app.include_router(records.patents, prefix="/api")
app.include_router(records.patents, prefix="/api")

# Module 3 - Research Papers
app.include_router(research_papers.router)
