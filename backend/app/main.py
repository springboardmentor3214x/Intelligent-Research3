"""
FastAPI Server Entrypoint
Research Funding & Innovation Intelligence Platform
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import notifications

# Optional import of earlier routers if available
try:
    from app.routers.auth import router as auth_router
except ImportError:
    auth_router = None

try:
    from app.routers.users import router as users_router
except ImportError:
    users_router = None

try:
    from app.routers.research_profile import router as research_profile_router
except ImportError:
    research_profile_router = None

try:
    from app.routers.publications import router as publications_router
except ImportError:
    publications_router = None

try:
    from app.routers.patents import router as patents_router
except ImportError:
    patents_router = None

# Automatically create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Research Funding & Innovation Intelligence Platform API",
    version="10.0.0",
    description="Enterprise Multi-Source Research, Funding, Patent, Innovation & Notification Intelligence Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
if auth_router:
    app.include_router(auth_router)
if users_router:
    app.include_router(users_router)
if research_profile_router:
    app.include_router(research_profile_router)
if publications_router:
    app.include_router(publications_router)
if patents_router:
    app.include_router(patents_router)

app.include_router(notifications.router)

@app.get("/")
def read_root():
    return {
        "message": "Research Funding & Innovation Intelligence Platform API",
        "status": "online",
        "version": "10.0.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "intelligence-engine",
        "version": "10.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
