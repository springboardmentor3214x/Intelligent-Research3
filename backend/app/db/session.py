from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

if not settings.DATABASE_URL or not settings.DATABASE_URL.startswith("postgresql"):
    raise RuntimeError("Supabase PostgreSQL DATABASE_URL is required. SQLite is disabled.")

# Configure connection engine for Supabase pooler
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

