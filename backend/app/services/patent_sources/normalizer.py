"""
Patent Normalizer — Module 5 Patent Landscape Analysis.

Transforms raw records from external patent sources into clean, normalized
PatentRecordCreate objects with deduplication fingerprints and derived WIPO domains.
"""

import re
from datetime import date, datetime
from typing import Any, Optional

from app.models.patent_landscape import ipc_to_domain
from app.schemas.patent import PatentRecordCreate


def _normalize_text(text: Optional[str]) -> str:
    """Lowercase alphanumeric-only string for deduplication fingerprints."""
    if not text:
        return ""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def _normalize_assignee_name(name: Optional[str]) -> str:
    """Standardize corporate assignee names for competitor analysis."""
    if not name:
        return "Unknown Assignee"
    cleaned = name.strip()
    # Normalize common corporate variations
    subs = [
        (r",?\s*(?:inc\.?|incorporated)\b", ""),
        (r",?\s*(?:llc|l\.l\.c\.)\b", ""),
        (r",?\s*(?:corp\.?|corporation)\b", ""),
        (r",?\s*(?:ltd\.?|limited)\b", ""),
        (r",?\s*(?:co\.?|company)\b", ""),
        (r",?\s*(?:gmbh)\b", ""),
        (r",?\s*(?:s\.a\.|sa)\b", ""),
    ]
    for pattern, replacement in subs:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or name.strip()


def _parse_date(val: Any) -> Optional[date]:
    """Parse various date formats (YYYY-MM-DD, YYYYMMDD, datetime, etc.)"""
    if not val:
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, datetime):
        return val.date()
    val_str = str(val).strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(val_str[:10], fmt).date()
        except ValueError:
            continue
    # Try year only
    if len(val_str) == 4 and val_str.isdigit():
        return date(int(val_str), 1, 1)
    return None


def normalize_uspto_record(raw: dict[str, Any]) -> Optional[PatentRecordCreate]:
    """Normalize a record from the USPTO Open Data Portal API."""
    title = raw.get("patentTitle") or raw.get("inventionTitle") or raw.get("title")
    if not title:
        return None

    source_id = str(raw.get("applicationNumberText") or raw.get("patentNumber") or raw.get("id") or "")
    patent_number = raw.get("patentNumber") or raw.get("patent_number")
    filing_date = _parse_date(raw.get("filingDate") or raw.get("appDate") or raw.get("applicationDate"))
    pub_date = _parse_date(raw.get("publicationDate") or raw.get("grantDate"))

    assignee = raw.get("assigneeEntityName") or raw.get("applicantName") or raw.get("assignee")
    assignee_norm = _normalize_assignee_name(assignee) if assignee else None

    # Classification
    ipc = raw.get("ipcClass") or raw.get("ipcClassification") or raw.get("cpcClassification") or raw.get("classification")
    if isinstance(ipc, list) and ipc:
        ipc_primary = str(ipc[0])
        all_classes = [str(c) for c in ipc]
    else:
        ipc_primary = str(ipc).strip() if ipc else None
        all_classes = [ipc_primary] if ipc_primary else []

    domain = raw.get("technologyDomain") or ipc_to_domain(ipc_primary)

    # Citation count
    citations = raw.get("citedDocumentCount") or raw.get("citation_count") or raw.get("cited_patent_count") or 0
    try:
        citation_count = int(citations)
    except (ValueError, TypeError):
        citation_count = 0

    abstract = raw.get("abstractText") or raw.get("abstract")

    url = raw.get("source_url")
    if not url and patent_number:
        clean_no = re.sub(r"[^0-9A-Za-z]", "", str(patent_number))
        url = f"https://patents.google.com/patent/US{clean_no}/en"

    return PatentRecordCreate(
        source="uspto",
        source_patent_id=source_id or None,
        patent_number=str(patent_number) if patent_number else None,
        title=str(title).strip(),
        abstract=str(abstract).strip() if abstract else None,
        assignee=str(assignee).strip() if assignee else None,
        assignee_normalized=assignee_norm,
        inventors=[],
        filing_date=filing_date,
        publication_date=pub_date,
        filing_year=filing_date.year if filing_date else (pub_date.year if pub_date else None),
        country=raw.get("country", "US"),
        patent_classification=ipc_primary,
        all_classifications=all_classes,
        technology_domain=domain,
        keywords=[],
        citation_count=citation_count,
        source_url=url,
        raw_metadata=raw,
    )


def normalize_lens_record(raw: dict[str, Any]) -> Optional[PatentRecordCreate]:
    """Normalize a record from The Lens Patent API."""
    title_data = raw.get("title")
    title = title_data if isinstance(title_data, str) else (title_data.get("text") if isinstance(title_data, dict) else None)
    if not title:
        return None

    lens_id = raw.get("lens_id") or raw.get("doc_number")
    patent_number = raw.get("doc_number")
    filing_date = _parse_date(raw.get("date_published") or raw.get("filing_date"))

    # Assignees
    assignees_raw = raw.get("applicants") or raw.get("owners") or []
    assignee = None
    if isinstance(assignees_raw, list) and assignees_raw:
        first = assignees_raw[0]
        assignee = first.get("name") if isinstance(first, dict) else str(first)
    elif isinstance(assignees_raw, str):
        assignee = assignees_raw

    assignee_norm = _normalize_assignee_name(assignee) if assignee else None

    # Classifications
    ipcr = raw.get("classifications_ipcr", {}).get("classifications", [])
    all_classes = [c.get("symbol") for c in ipcr if isinstance(c, dict) and c.get("symbol")]
    ipc_primary = all_classes[0] if all_classes else None
    domain = ipc_to_domain(ipc_primary)

    # Citations
    citation_count = raw.get("citation_count") or raw.get("cited_by_patent_count") or 0

    abstract_data = raw.get("abstract")
    abstract = abstract_data if isinstance(abstract_data, str) else (abstract_data.get("text") if isinstance(abstract_data, dict) else None)

    return PatentRecordCreate(
        source="lens",
        source_patent_id=str(lens_id) if lens_id else None,
        patent_number=str(patent_number) if patent_number else None,
        title=str(title).strip(),
        abstract=str(abstract).strip() if abstract else None,
        assignee=str(assignee).strip() if assignee else None,
        assignee_normalized=assignee_norm,
        inventors=[],
        filing_date=filing_date,
        filing_year=filing_date.year if filing_date else None,
        country=raw.get("jurisdiction", "US"),
        patent_classification=ipc_primary,
        all_classifications=all_classes,
        technology_domain=domain,
        keywords=[],
        citation_count=int(citation_count) if citation_count else 0,
        source_url=f"https://www.lens.org/lens/patent/{lens_id}" if lens_id else None,
        raw_metadata=raw,
    )


def normalize_serpapi_record(raw: dict[str, Any]) -> Optional[PatentRecordCreate]:
    """
    Normalize a record from SerpApi Google Patents Search (engine=google_patents)
    or Google Patents Details (engine=google_patents_details).
    """
    title = raw.get("title")
    if not title:
        return None

    # Patent ID & publication number
    patent_id = raw.get("patent_id") or raw.get("publication_number")
    pub_number = raw.get("publication_number") or raw.get("patent_id")
    if pub_number and pub_number.startswith("patent/"):
        parts = pub_number.split("/")
        if len(parts) >= 2:
            pub_number = parts[1]

    # Dates
    filing_date = _parse_date(raw.get("filing_date") or raw.get("priority_date"))
    pub_date = _parse_date(raw.get("publication_date") or raw.get("grant_date"))
    filing_year = filing_date.year if filing_date else (pub_date.year if pub_date else None)

    # Assignee (handle string or list of dicts/strings)
    assignees_raw = raw.get("assignees") or raw.get("assignee")
    assignee = None
    if isinstance(assignees_raw, list) and assignees_raw:
        first = assignees_raw[0]
        assignee = first if isinstance(first, str) else (first.get("name") if isinstance(first, dict) else str(first))
    elif isinstance(assignees_raw, str):
        assignee = assignees_raw

    if not assignee or assignee.strip().lower() in ("none", "null", ""):
        assignee = "Not available"

    assignee_norm = _normalize_assignee_name(assignee)

    # Inventors
    inventors_raw = raw.get("inventors") or raw.get("inventor")
    inventors = []
    if isinstance(inventors_raw, list):
        for inv in inventors_raw:
            if isinstance(inv, dict) and inv.get("name"):
                inventors.append(inv["name"])
            elif isinstance(inv, str):
                inventors.append(inv)
    elif isinstance(inventors_raw, str):
        inventors = [inventors_raw]

    # Abstract / Snippet
    abstract = raw.get("abstract") or raw.get("snippet") or raw.get("description")

    # Classifications
    all_classes: list[str] = []
    classifications_raw = raw.get("classifications") or raw.get("classification")
    if isinstance(classifications_raw, list):
        for c in classifications_raw:
            if isinstance(c, dict) and c.get("code"):
                all_classes.append(c["code"])
            elif isinstance(c, str):
                all_classes.append(c)
    elif isinstance(classifications_raw, str):
        all_classes.append(classifications_raw)

    ipc_primary = all_classes[0] if all_classes else None

    # Derive technology domain from classification or keywords/title
    domain = ipc_to_domain(ipc_primary)
    if domain == "General Technology":
        t_lower = (str(title) + " " + str(abstract or "")).lower()
        if any(w in t_lower for w in ["quantum", "qubit", "superconducting"]):
            domain = "Quantum Computing & Advanced Hardware"
            if not ipc_primary:
                ipc_primary = "G06N10/00"
        elif any(w in t_lower for w in ["neural", "machine learning", "deep learning", "artificial intelligence", "transformer", "model"]):
            domain = "Artificial Intelligence & Machine Learning"
            if not ipc_primary:
                ipc_primary = "G06N3/00"
        elif any(w in t_lower for w in ["vision", "image processing", "segmentation", "detection", "camera", "optical"]):
            domain = "Computer Vision & Image Processing"
            if not ipc_primary:
                ipc_primary = "G06T7/00"
        elif any(w in t_lower for w in ["medical", "imaging", "tomography", "mri", "ultrasound", "patient", "clinical", "health"]):
            domain = "Medical & Healthcare Devices"
            if not ipc_primary:
                ipc_primary = "A61B5/00"
        elif any(w in t_lower for w in ["battery", "electrolyte", "anode", "cathode", "lithium", "charging", "solar", "energy"]):
            domain = "Power Generation & Storage"
            if not ipc_primary:
                ipc_primary = "H01M"
        elif any(w in t_lower for w in ["network", "communication", "wireless", "5g", "transmission", "antenna", "signal"]):
            domain = "Data Transmission & Networks"
            if not ipc_primary:
                ipc_primary = "H04L"
        elif any(w in t_lower for w in ["robot", "robotics", "autonomous", "drone", "actuator", "vehicle"]):
            domain = "Robotics & Autonomous Systems"
            if not ipc_primary:
                ipc_primary = "B25J"
        elif any(w in t_lower for w in ["security", "cryptography", "encryption", "blockchain", "privacy"]):
            domain = "Cybersecurity & Cryptography"
            if not ipc_primary:
                ipc_primary = "H04L9/00"
        elif any(w in t_lower for w in ["genetic", "dna", "rna", "pharmaceutical", "drug", "biological", "protein"]):
            domain = "Biomedical & Life Sciences"
            if not ipc_primary:
                ipc_primary = "A61K"

    # Citation count
    citation_count = 0
    if raw.get("citation_count") is not None:
        try:
            citation_count = int(raw["citation_count"])
        except (ValueError, TypeError):
            citation_count = 0
    elif raw.get("cited_by"):
        cited_by = raw["cited_by"]
        if isinstance(cited_by, dict):
            orig = cited_by.get("original", [])
            citation_count = len(orig) if isinstance(orig, list) else 0
        elif isinstance(cited_by, list):
            citation_count = len(cited_by)

    # Source URL
    url = raw.get("patent_link") or raw.get("link") or raw.get("source_url")
    if not url and pub_number:
        clean_no = re.sub(r"[^0-9A-Za-z]", "", str(pub_number))
        url = f"https://patents.google.com/patent/{clean_no}/en"

    return PatentRecordCreate(
        source="google_patents",
        source_patent_id=str(patent_id) if patent_id else str(pub_number),
        patent_number=str(pub_number).strip().upper() if pub_number else None,
        title=str(title).strip(),
        abstract=str(abstract).strip() if abstract else None,
        assignee=str(assignee).strip(),
        assignee_normalized=assignee_norm,
        inventors=inventors,
        filing_date=filing_date,
        publication_date=pub_date,
        filing_year=filing_year,
        country=raw.get("country", "US"),
        patent_classification=ipc_primary or "Not available",
        all_classifications=all_classes,
        technology_domain=domain,
        keywords=raw.get("prior_art_keywords", []),
        citation_count=citation_count,
        source_url=url,
        raw_metadata=raw,
    )
