from app.db.base import Base
from app.db.session import engine
from app.models import profile, user
from app.models import research_paper   # noqa: F401 — registers research_papers table
from app.models import funding          # noqa: F401 — registers funding tables
from app.models import patent_landscape  # noqa: F401 — registers patent_records table (Module 5)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)