from app.db.base import Base
from app.db.session import engine
from app.models import profile, user, technology  # noqa: F401 — ensures tables are registered
try:
    from app.models import research_paper  # noqa: F401 — registers research_papers table
except Exception:
    pass
try:
    from app.models import innovation_score  # noqa: F401 — registers innovation_scores table
except Exception:
    pass
try:
    from app.models import commercialization  # noqa: F401 — registers commercialization table
except Exception:
    pass
try:
    from app.models import funding  # noqa: F401 — registers funding_opportunities table
except Exception:
    pass


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
