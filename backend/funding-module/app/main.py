from fastapi import FastAPI

from app.database import Base, engine
from app.routers.funding import router as funding_router

# In the real project, use Alembic for migrations instead of create_all().
# This is fine for local dev/demo purposes only.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Module 4 - Funding Intelligence API")

app.include_router(funding_router)


@app.get("/health")
def health():
    return {"status": "ok"}
