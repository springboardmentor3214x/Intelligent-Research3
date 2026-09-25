"""
Database session configuration.
- Local PostgreSQL: no SSL needed
- Supabase pooler: requires SSL + sslmode=require
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

if not settings.DATABASE_URL or not settings.DATABASE_URL.startswith("postgresql"):
    raise RuntimeError("PostgreSQL DATABASE_URL is required. SQLite is disabled.")


def _build_engine(url: str):
    """Build SQLAlchemy engine with appropriate settings for local or cloud DB."""
    is_supabase = "supabase.com" in url or "supabase.co" in url

    if is_supabase:
        # Supabase requires SSL; add sslmode if missing
        if "sslmode" not in url:
            sep = "&" if "?" in url else "?"
            url = url + sep + "sslmode=require"
        connect_args = {"connect_timeout": 15, "sslmode": "require"}
    else:
        # Local PostgreSQL — no SSL
        connect_args = {"connect_timeout": 10}

    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
        connect_args=connect_args,
    )


engine = _build_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
