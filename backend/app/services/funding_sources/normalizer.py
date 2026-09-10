"""
Funding Normalizer — Module 4.

Converts raw grants.gov records into FundingOpportunityCreate Pydantic objects.
Source-specific parsing is isolated here — DB never sees raw API responses.
"""
import logging
import re
from datetime import date, datetime
from typing import Any

from app.schemas.funding import FundingOpportunityCreate

logger = logging.getLogger(__name__)

_NON_ALPHA = re.compile(r"[^a-z0-9]")


def _make_fingerprint(text: str | None, max_len: int = 200) -> str | None:
    """Produce a lowercase-alphanumeric fingerprint for dedup."""
    if not text:
        return None
    return _NON_ALPHA.sub("", text.casefold())[:max_len]


def _parse_date(raw: str | None) -> date | None:
    """Parse common date formats from grants.gov."""
    if not raw:
        return None
    raw = raw.strip()
    # Try common formats
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%Y%m%d"):
        try:
            return datetime.strptime(raw, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def _extract_keywords(description: str | None, category: str | None) -> list[str]:
    """Extract simple keywords from description and category fields."""
    keywords: list[str] = []
    if category and category.strip():
        keywords.append(category.strip())
    return keywords


def _classify_funding_type(opp_type: str | None) -> str:
    """Normalize grants.gov opportunity type to standard labels."""
    if not opp_type:
        return "grant"
    t = opp_type.lower()
    if "fellow" in t:
        return "fellowship"
    if "contract" in t:
        return "contract"
    if "cooperative" in t:
        return "cooperative_agreement"
    if "other" in t:
        return "other"
    return "grant"


def make_title_fingerprint(title: str | None) -> str | None:
    return _make_fingerprint(title, max_len=200)


def make_org_fingerprint(org: str | None) -> str | None:
    return _make_fingerprint(org, max_len=100)


class GrantsGovNormalizer:
    """
    Converts a raw grants.gov oppHit dict into a FundingOpportunityCreate.

    Returns None when the record cannot be safely normalized.
    """

    SOURCE_NAME = "grants_gov"

    def normalize(self, raw: dict[str, Any]) -> FundingOpportunityCreate | None:
        if not isinstance(raw, dict):
            logger.warning("Normalizer received non-dict record: %s", type(raw))
            return None

        # ── External ID ──────────────────────────────────────────────────────
        external_id: str | None = str(raw.get("id") or raw.get("oppNum") or "").strip() or None

        # ── Title (required) ─────────────────────────────────────────────────
        title: str | None = (raw.get("title") or "").strip() or None
        if not title:
            logger.info("Skipping funding record %s — missing title", external_id)
            return None

        # ── Organization ─────────────────────────────────────────────────────
        organization = (raw.get("agencyName") or raw.get("agency") or "").strip() or None

        # ── Description ──────────────────────────────────────────────────────
        description = (raw.get("synopsis") or raw.get("description") or "").strip() or None

        # ── Financial ────────────────────────────────────────────────────────
        funding_amount: float | None = None
        funding_amount_max: float | None = None
        funding_amount_min: float | None = None
        raw_amount = raw.get("awardCeiling") or raw.get("award_ceiling")
        if raw_amount:
            try:
                funding_amount_max = float(str(raw_amount).replace(",", ""))
                funding_amount = funding_amount_max
            except (ValueError, TypeError):
                pass
        raw_floor = raw.get("awardFloor") or raw.get("award_floor")
        if raw_floor:
            try:
                funding_amount_min = float(str(raw_floor).replace(",", ""))
            except (ValueError, TypeError):
                pass

        # ── Deadline ─────────────────────────────────────────────────────────
        deadline_raw = (
            raw.get("closeDate")
            or raw.get("close_date")
            or raw.get("applicationsDueDate")
        )
        deadline = _parse_date(deadline_raw)

        # ── Status ───────────────────────────────────────────────────────────
        opp_status = (raw.get("oppStatus") or raw.get("status") or "posted").lower()
        if opp_status in ("posted", "open", "forecasted"):
            status = "open"
        elif opp_status in ("closed", "archived"):
            status = "closed"
        else:
            status = opp_status

        # ── Funding type ─────────────────────────────────────────────────────
        funding_type = _classify_funding_type(
            raw.get("oppType") or raw.get("fundingInstrumentTypes")
        )

        # ── Research areas ───────────────────────────────────────────────────
        research_areas: list[str] = []
        category = (raw.get("categoryOfFundingActivity") or raw.get("category") or "").strip()
        if category:
            research_areas.append(category)
        eligibility_types = raw.get("eligibleApplicants") or raw.get("applicantTypes") or []
        if isinstance(eligibility_types, list):
            research_areas.extend([str(e) for e in eligibility_types if e])

        # ── Keywords ─────────────────────────────────────────────────────────
        keywords = _extract_keywords(description, category)

        # ── Eligibility ──────────────────────────────────────────────────────
        eligibility = (
            raw.get("applicantTypesDescription")
            or raw.get("additionalInformationText")
            or ""
        ).strip() or None

        # ── URLs ─────────────────────────────────────────────────────────────
        opp_num = raw.get("oppNum") or raw.get("number") or ""
        source_url = (
            raw.get("grantsGovURL")
            or (f"https://www.grants.gov/search-results-detail/{opp_num}" if opp_num else None)
        )
        application_url = raw.get("applicationUrl") or source_url

        return FundingOpportunityCreate(
            external_id=external_id,
            source=self.SOURCE_NAME,
            title=title,
            organization=organization,
            description=description,
            funding_amount=funding_amount,
            funding_amount_min=funding_amount_min,
            funding_amount_max=funding_amount_max,
            currency="USD",
            deadline=deadline,
            status=status,
            funding_type=funding_type,
            country="US",
            research_areas=research_areas,
            keywords=keywords,
            eligibility=eligibility,
            source_url=source_url,
            application_url=application_url,
        )
