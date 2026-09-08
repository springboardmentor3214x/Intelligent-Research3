"""
backend/app/database.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

SQLAlchemy engine, session factory, and declarative Base.
All models import Base from here; Alembic imports it via env.py.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()

# ── Engine ────────────────────────────────────────────────────────────────────
# SQLite needs connect_args for thread safety; PostgreSQL does not.
_connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    echo=False,          # set True to log SQL statements during development
    pool_pre_ping=True,  # verify connections before use
)

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ── Declarative Base ──────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """All ORM models extend this."""
    pass


# ── FastAPI dependency ────────────────────────────────────────────────────────
def get_db():
    """
    Yields a database session for a single request and closes it afterwards.
    Usage in route handlers:

        db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
