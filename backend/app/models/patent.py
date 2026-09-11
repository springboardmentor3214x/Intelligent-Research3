"""Module 5 — Patent Landscape Analysis model re-exports.

Re-exports the core PatentRecord model and IPC classification mapping
from app.models.patent_landscape to ensure single source of truth.
"""

from app.models.patent_landscape import PatentRecord, ipc_to_domain

__all__ = [
    "PatentRecord",
    "ipc_to_domain",
]
