try:
    from app.models.profile import Patent, Publication, ResearchProfile, ResearchTag
    from app.models.user import RoleEnum, User
except Exception:
    pass

try:
    from app.models.funding import FundingOpportunity
except Exception:
    pass

try:
    from app.models.technology import (
        Technology, TechnologyMetric, TechnologyTrend,
        TechnologyMaturity, TechnologyOpportunity, TechnologyCompetitor, DataSourceLog,
    )
except Exception:
    pass

__all__ = [
    "User", "RoleEnum", "ResearchProfile", "ResearchTag", "Publication", "Patent",
    "FundingOpportunity",
    "Technology", "TechnologyMetric", "TechnologyTrend",
    "TechnologyMaturity", "TechnologyOpportunity", "TechnologyCompetitor", "DataSourceLog",
]
from app.models.profile import Patent, Publication, ResearchProfile, ResearchTag
from app.models.user import RoleEnum, User
from app.models.research_paper import ResearchPaper
from app.models.innovation_score import InnovationScore

__all__ = [
    "User",
    "RoleEnum",
    "ResearchProfile",
    "ResearchTag",
    "Publication",
    "Patent",
    "ResearchPaper",
    "InnovationScore",
]
