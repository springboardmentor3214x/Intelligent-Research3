from fastapi import FastAPI

app = FastAPI(
    title="Research Funding & Innovation Intelligence Platform",
    version="0.1.0",
    description="Foundation for the user authentication and RBAC module.",
)


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
