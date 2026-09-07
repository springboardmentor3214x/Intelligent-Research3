from app.db.base import Base
from app.db.session import engine
from app.models import profile, user
from app.models import research_paper  # noqa: F401 — registers research_papers table


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
