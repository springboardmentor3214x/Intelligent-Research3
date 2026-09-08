"""
backend/app/services/funding_sources/normalizer.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

Converts raw dicts produced by each source connector into validated
FundingOpportunityCreate Pydantic objects ready for database insertion.

Key responsibilities:
  1. Map source-specific field names → canonical FundingOpportunity fields
  2. Parse and normalise deadline strings → UTC datetime (or None)
  3. Sanitise / truncate string fields to stay within column lengths
  4. Validate required fields; reject records that cannot be normalised
  5. Log every rejected record with a reason so the sync job can count them
  6. NEVER raise an unhandled exception — always return None for bad records

Supported date formats (in priority order):
  - ISO-8601   : 2026-09-30, 2026-09-30T00:00:00Z
  - US short   : 09/30/2026  (Grants.gov uses MM/DD/YYYY)
  - NIH suffix : 2026-09-30T00:00:00  (no TZ)
  - Partial     : Sep 2026, September 2026
  - python-dateutil fuzzy parse as final fallback
"""

import logging
import re
from datetime import datetime, timezone
from typing import Any

from dateutil import parser as dateutil_parser
from pydantic import ValidationError

from app.schemas.funding import FundingOpportunityCreate

logger = logging.getLogger(__name__)

# Fields that MUST be present and non-empty for a record to be accepted
_REQUIRED_FIELDS = ("external_id", "title")

# Maximum lengths matching the DB column definitions
_MAX_LENGTHS: dict[str, int] = {
    "external_id": 512,
    "title": 1024,
    "organization": 512,
    "source_url": 2048,
    "application_url": 2048,
    "currency": 8,
    "country": 4,
    "funding_type": 64,
    "status": 16,
}


def normalize_opportunity(
    raw: dict[str, Any],
    source: str,
) -> FundingOpportunityCreate | None:
    """
    Normalize a raw source dict into a validated FundingOpportunityCreate.

    Args:
        raw:    Raw dict from a source connector (see connector module docstrings
                for expected shape).
        source: Source identifier string e.g. "nih_reporter" | "grants_gov"

    Returns:
        FundingOpportunityCreate on success, None if the record is rejected.
        Logs the rejection reason at WARNING level.
    """
    try:
        return _normalize(raw, source)
    except Exception as exc:  # noqa: BLE001 — safety net, must not propagate
        logger.warning(
            "[normalizer] Unexpected error while normalizing record from %r: %s: %s",
            source,
            type(exc).__name__,
            exc,
        )
        return None


# ── Internal implementation ────────────────────────────────────────────────────

def _normalize(raw: dict[str, Any], source: str) -> FundingOpportunityCreate | None:
    # ── 1. Required field presence check ──────────────────────────────────────
    for field in _REQUIRED_FIELDS:
        val = raw.get(field)
        if not val or not str(val).strip():
            logger.warning(
                "[normalizer][%s] Rejected — missing required field %r. "
                "external_id=%r title=%r",
                source,
                field,
                raw.get("external_id"),
                raw.get("title"),
            )
            return None

    # ── 2. Truncate string fields to column limits ─────────────────────────────
    cleaned: dict[str, Any] = {}
    for field, max_len in _MAX_LENGTHS.items():
        val = raw.get(field)
        if val is not None:
            cleaned[field] = str(val)[:max_len]
        else:
            cleaned[field] = val

    # ── 3. Scalar pass-through fields ─────────────────────────────────────────
    cleaned["title"] = str(raw.get("title", "")).strip()[: _MAX_LENGTHS["title"]]
    cleaned["organization"] = str(raw.get("organization") or "").strip()[
        : _MAX_LENGTHS["organization"]
    ]
    cleaned["description"] = _clean_text(raw.get("description"))
    cleaned["eligibility"] = _clean_text(raw.get("eligibility"))
    cleaned["funding_amount"] = _parse_amount(raw.get("funding_amount"))
    cleaned["currency"] = str(raw.get("currency") or "USD")[: _MAX_LENGTHS["currency"]]
    cleaned["country"] = str(raw.get("country") or "US")[: _MAX_LENGTHS["country"]]
    cleaned["funding_type"] = _normalize_funding_type(raw.get("funding_type"))
    cleaned["status"] = _normalize_status(raw.get("status"))

    # ── 4. List fields ─────────────────────────────────────────────────────────
    cleaned["research_areas"] = _clean_list(raw.get("research_areas"))
    cleaned["keywords"] = _clean_list(raw.get("keywords"))

    # ── 5. Deadline ────────────────────────────────────────────────────────────
    cleaned["deadline"] = _parse_deadline(raw.get("deadline"), source)

    # ── 6. URLs ───────────────────────────────────────────────────────────────
    cleaned["source_url"] = _clean_url(raw.get("source_url"))
    cleaned["application_url"] = _clean_url(
        raw.get("application_url") or raw.get("source_url")
    )

    # ── 7. Source keys ────────────────────────────────────────────────────────
    cleaned["external_id"] = str(raw["external_id"])[: _MAX_LENGTHS["external_id"]]
    cleaned["source"] = source

    # ── 8. Validate with Pydantic ──────────────────────────────────────────────
    try:
        return FundingOpportunityCreate(**cleaned)
    except ValidationError as exc:
        logger.warning(
            "[normalizer][%s] Pydantic validation failed for external_id=%r: %s",
            source,
            cleaned.get("external_id"),
            exc,
        )
        return None


# ── Helper functions ───────────────────────────────────────────────────────────

def _clean_text(val: Any) -> str | None:
    """Strip and return text, or None if empty."""
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def _clean_url(val: Any) -> str | None:
    """Return a cleaned URL string, or None if empty."""
    if val is None:
        return None
    s = str(val).strip()
    return s[:2048] if s else None


def _clean_list(val: Any) -> list[str]:
    """
    Coerce various list representations to a clean list of non-empty strings.
    Handles: None, str (comma/semicolon-split), list.
    """
    if val is None:
        return []
    if isinstance(val, str):
        parts = re.split(r"[,;|]", val)
        return [p.strip() for p in parts if p.strip()]
    if isinstance(val, list):
        return [str(item).strip() for item in val if item and str(item).strip()]
    return []


def _parse_amount(val: Any) -> float | None:
    """Parse funding amount; return None on missing/invalid."""
    if val is None:
        return None
    try:
        amount = float(str(val).replace(",", "").replace("$", ""))
        return amount if amount > 0 else None
    except (TypeError, ValueError):
        return None


def _normalize_funding_type(val: Any) -> str:
    """Map raw funding_type to one of: grant | fellowship | contract | other."""
    if not val:
        return "grant"
    s = str(val).lower().strip()
    if "fellowship" in s:
        return "fellowship"
    if "contract" in s:
        return "contract"
    if "grant" in s:
        return "grant"
    return "other"


def _normalize_status(val: Any) -> str:
    """Map raw status string to one of: active | expired | closed."""
    if not val:
        return "active"
    s = str(val).lower().strip()
    if s in ("expired", "archived"):
        return "expired"
    if s in ("closed", "inactive"):
        return "closed"
    return "active"


# Date format patterns tried in order before falling back to dateutil
_DATE_PATTERNS = [
    # ISO-8601 with timezone
    ("%Y-%m-%dT%H:%M:%SZ", True),
    ("%Y-%m-%dT%H:%M:%S", False),
    # Date-only
    ("%Y-%m-%d", False),
    # US short (Grants.gov)
    ("%m/%d/%Y", False),
    # Long form
    ("%B %d, %Y", False),
    ("%b %d, %Y", False),
]


def _parse_deadline(raw: Any, source: str) -> datetime | None:
    """
    Parse a deadline string into a UTC-aware datetime.

    Tries several known formats first, then falls back to dateutil fuzzy parse.
    Returns None if the value is missing, empty, or unparseable.
    """
    if raw is None:
        return None
    s = str(raw).strip()
    if not s or s.lower() in ("none", "null", "n/a", "tbd"):
        return None

    # Try known patterns
    for fmt, has_tz in _DATE_PATTERNS:
        try:
            dt = datetime.strptime(s, fmt)
            if has_tz:
                return dt.replace(tzinfo=timezone.utc)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    # dateutil fuzzy fallback
    try:
        dt = dateutil_parser.parse(s, fuzzy=True)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:  # noqa: BLE001
        logger.debug(
            "[normalizer][%s] Could not parse deadline %r — stored as NULL",
            source,
            s,
        )
        return None
