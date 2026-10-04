"""
backend/app/models/research_profile.py
Compatibility shim forwarding to canonical profile models in app.models.profile.
Prevents duplicate DeclarativeBase class registrations.
"""
from app.models.profile import (
    Patent,
    Publication,
    ResearchProfile,
    ResearchTag,
    TagKind,
)

__all__ = [
    "Patent",
    "Publication",
    "ResearchProfile",
    "ResearchTag",
    "TagKind",
]