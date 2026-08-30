from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.research_profile import router as research_profile_router
from app.routers.publications import router as publications_router
from app.routers.patents import router as patents_router


app = FastAPI(
    title="Research Funding & Innovation Intelligence Platform",
    version="0.1.0",
    description="Research Funding & Innovation Intelligence Platform API",
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(research_profile_router)
app.include_router(publications_router)
app.include_router(patents_router)


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