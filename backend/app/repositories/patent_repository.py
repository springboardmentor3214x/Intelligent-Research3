"""
Patent Repository — Module 5 Patent Landscape Analysis.

Database access layer for PatentRecord queries, deduplication, search filtering,
and analytical aggregations (trends, competitor metrics, innovation mapping).
"""

import json
import re
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from app.models.patent_landscape import PatentRecord, ipc_to_domain
from app.schemas.patent import PatentRecordCreate


def _text_fp(text: Optional[str]) -> str:
    """Fingerprint for deduplication."""
    if not text:
        return ""
    return re.sub(r"[^a-z0-9]", "", text.lower())[:255]


# ---------------------------------------------------------------------------
# Ingestion & Deduplication
# ---------------------------------------------------------------------------

def create_or_update_patent(
    db: Session,
    item: PatentRecordCreate,
) -> tuple[PatentRecord, bool, bool]:
    """
    Upsert a patent record with multi-stage deduplication.
    Returns: (record, is_inserted, is_updated)
    """
    title_fp = _text_fp(item.title)
    assignee_fp = _text_fp(item.assignee)

    existing: Optional[PatentRecord] = None

    # Stage 1: By source + source_patent_id
    if item.source and item.source_patent_id:
        existing = (
            db.query(PatentRecord)
            .filter(
                and_(
                    PatentRecord.source == item.source,
                    PatentRecord.source_patent_id == item.source_patent_id,
                )
            )
            .first()
        )

    # Stage 2: By unique patent_number
    if not existing and item.patent_number:
        clean_no = item.patent_number.strip().upper()
        existing = (
            db.query(PatentRecord)
            .filter(PatentRecord.patent_number == clean_no)
            .first()
        )

    # Stage 3: Fingerprint fallback
    if not existing and title_fp:
        q = db.query(PatentRecord).filter(PatentRecord.title_fingerprint == title_fp)
        if assignee_fp:
            q = q.filter(PatentRecord.assignee_fingerprint == assignee_fp)
        if item.filing_year:
            q = q.filter(PatentRecord.filing_year == item.filing_year)
        existing = q.first()

    # Derived domain if missing
    domain = item.technology_domain or ipc_to_domain(item.patent_classification)

    if existing:
        # Update fields if new data provided
        changed = False
        if item.title and existing.title != item.title:
            existing.title = item.title
            changed = True
        if item.abstract and not existing.abstract:
            existing.abstract = item.abstract
            changed = True
        if item.assignee and not existing.assignee:
            existing.assignee = item.assignee
            existing.assignee_normalized = item.assignee_normalized
            changed = True
        if item.patent_classification and not existing.patent_classification:
            existing.patent_classification = item.patent_classification
            existing.technology_domain = domain
            changed = True
        if item.citation_count is not None and (existing.citation_count is None or item.citation_count > existing.citation_count):
            existing.citation_count = item.citation_count
            changed = True
        if item.source_url and not existing.source_url:
            existing.source_url = item.source_url
            changed = True

        if changed:
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing, False, True
        return existing, False, False

    # Insert new record
    new_record = PatentRecord(
        source=item.source,
        source_patent_id=item.source_patent_id,
        patent_number=item.patent_number.strip().upper() if item.patent_number else None,
        title=item.title,
        abstract=item.abstract,
        assignee=item.assignee,
        assignee_normalized=item.assignee_normalized or item.assignee,
        inventors=json.dumps(item.inventors) if item.inventors else None,
        filing_date=item.filing_date,
        publication_date=item.publication_date,
        grant_date=item.grant_date,
        filing_year=item.filing_year or (item.filing_date.year if item.filing_date else None),
        country=item.country,
        patent_classification=item.patent_classification,
        all_classifications=json.dumps(item.all_classifications) if item.all_classifications else None,
        technology_domain=domain,
        keywords=json.dumps(item.keywords) if item.keywords else None,
        citation_count=item.citation_count if item.citation_count is not None else 0,
        claims_text=item.claims_text,
        description_text=item.description_text,
        source_url=item.source_url,
        raw_metadata=json.dumps(item.raw_metadata) if item.raw_metadata else None,
        title_fingerprint=title_fp,
        assignee_fingerprint=assignee_fp,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record, True, False


# ---------------------------------------------------------------------------
# Query & Search
# ---------------------------------------------------------------------------

def get_patent_by_id(db: Session, patent_id: int) -> Optional[PatentRecord]:
    return db.query(PatentRecord).filter(PatentRecord.id == patent_id).first()


def search_patents(
    db: Session,
    keyword: Optional[str] = None,
    assignee: Optional[str] = None,
    domain: Optional[str] = None,
    classification: Optional[str] = None,
    filing_year_min: Optional[int] = None,
    filing_year_max: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    sort_by: str = "filing_date",
    sort_order: str = "desc",
) -> tuple[list[PatentRecord], int]:
    """
    Search and filter real patent records with pagination.
    """
    query = db.query(PatentRecord)

    # Keyword filter on title, abstract, number, assignee, or domain
    if keyword and keyword.strip():
        tokens = [t.strip().lower() for t in keyword.strip().split() if len(t.strip()) > 1]
        if tokens:
            for token in tokens:
                tk = f"%{token}%"
                query = query.filter(
                    or_(
                        func.lower(PatentRecord.title).like(tk),
                        func.lower(PatentRecord.abstract).like(tk),
                        func.lower(PatentRecord.patent_number).like(tk),
                        func.lower(PatentRecord.assignee).like(tk),
                        func.lower(PatentRecord.assignee_normalized).like(tk),
                        func.lower(PatentRecord.technology_domain).like(tk),
                    )
                )
        else:
            k = f"%{keyword.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(PatentRecord.title).like(k),
                    func.lower(PatentRecord.abstract).like(k),
                    func.lower(PatentRecord.patent_number).like(k),
                )
            )

    # Assignee filter
    if assignee and assignee.strip():
        a = f"%{assignee.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(PatentRecord.assignee).like(a),
                func.lower(PatentRecord.assignee_normalized).like(a),
            )
        )

    # Technology domain
    if domain and domain.strip() and domain.strip().upper() != "ALL":
        query = query.filter(PatentRecord.technology_domain == domain.strip())

    # Classification
    if classification and classification.strip():
        c = f"%{classification.strip().upper()}%"
        query = query.filter(
            or_(
                PatentRecord.patent_classification.ilike(c),
                PatentRecord.all_classifications.ilike(c),
            )
        )

    # Year range
    if filing_year_min:
        query = query.filter(PatentRecord.filing_year >= filing_year_min)
    if filing_year_max:
        query = query.filter(PatentRecord.filing_year <= filing_year_max)

    total = query.count()

    # Sorting
    sort_col = PatentRecord.filing_date
    if sort_by == "citation_count":
        sort_col = PatentRecord.citation_count
    elif sort_by == "title":
        sort_col = PatentRecord.title
    elif sort_by == "created_at":
        sort_col = PatentRecord.created_at

    if sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc().nullslast(), PatentRecord.id.asc())
    else:
        query = query.order_by(sort_col.desc().nullslast(), PatentRecord.id.desc())

    offset = max(0, (page - 1) * page_size)
    items = query.offset(offset).limit(page_size).all()
    return items, total


# ---------------------------------------------------------------------------
# Analytical Aggregations (Trends, Competitors, Innovation Map)
# ---------------------------------------------------------------------------

def get_patent_trends(
    db: Session,
    domain: Optional[str] = None,
    assignee: Optional[str] = None,
    query: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Calculate real patent filing trends over time (Year -> Count).
    """
    q = (
        db.query(
            PatentRecord.filing_year,
            func.count(PatentRecord.id).label("count"),
        )
        .filter(PatentRecord.filing_year.isnot(None))
        .filter(PatentRecord.filing_year > 1980)
    )

    if domain and domain.strip() and domain.strip().upper() != "ALL":
        q = q.filter(PatentRecord.technology_domain == domain.strip())

    if assignee and assignee.strip():
        a = f"%{assignee.strip().lower()}%"
        q = q.filter(func.lower(PatentRecord.assignee).like(a))

    if query and query.strip():
        k = f"%{query.strip().lower()}%"
        q = q.filter(func.lower(PatentRecord.title).like(k))

    rows = (
        q.group_by(PatentRecord.filing_year)
        .order_by(PatentRecord.filing_year.asc())
        .all()
    )

    return [{"year": int(r[0]), "count": int(r[1])} for r in rows if r[0]]


def get_competitor_analysis(
    db: Session,
    domain: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """
    Identify top patent-owning organizations (Competitors) using the ASSIGNEE field.
    Returns:
      Assignee name, actual patent count, total citations, filing timeline, domain distribution.
    """
    base_q = db.query(PatentRecord).filter(
        PatentRecord.assignee.isnot(None),
        PatentRecord.assignee != "",
    )

    if domain and domain.strip() and domain.strip().upper() != "ALL":
        base_q = base_q.filter(PatentRecord.technology_domain == domain.strip())

    if query and query.strip():
        k = f"%{query.strip().lower()}%"
        base_q = base_q.filter(func.lower(PatentRecord.title).like(k))

    # Top assignees by count
    top_assignees_query = (
        base_q.with_entities(
            func.coalesce(PatentRecord.assignee_normalized, PatentRecord.assignee).label("norm_assignee"),
            func.count(PatentRecord.id).label("p_count"),
            func.coalesce(func.sum(PatentRecord.citation_count), 0).label("citations"),
        )
        .group_by("norm_assignee")
        .order_by(desc("p_count"))
        .limit(limit)
        .all()
    )

    results: list[dict[str, Any]] = []

    for row in top_assignees_query:
        assignee_name = row[0]
        patent_count = int(row[1])
        citations = int(row[2])

        # Timeline for this assignee
        timeline_rows = (
            db.query(
                PatentRecord.filing_year,
                func.count(PatentRecord.id),
            )
            .filter(
                or_(
                    PatentRecord.assignee_normalized == assignee_name,
                    PatentRecord.assignee == assignee_name,
                ),
                PatentRecord.filing_year.isnot(None),
            )
            .group_by(PatentRecord.filing_year)
            .order_by(PatentRecord.filing_year.asc())
            .all()
        )
        timeline = [{"year": int(t[0]), "count": int(t[1])} for t in timeline_rows if t[0]]

        # Domain distribution
        domain_rows = (
            db.query(
                PatentRecord.technology_domain,
                func.count(PatentRecord.id),
            )
            .filter(
                or_(
                    PatentRecord.assignee_normalized == assignee_name,
                    PatentRecord.assignee == assignee_name,
                ),
                PatentRecord.technology_domain.isnot(None),
            )
            .group_by(PatentRecord.technology_domain)
            .order_by(desc(func.count(PatentRecord.id)))
            .limit(5)
            .all()
        )
        domains = [{"domain": d[0] or "General", "count": int(d[1])} for d in domain_rows]

        # Primary classification
        dominant_class_row = (
            db.query(
                PatentRecord.patent_classification,
                func.count(PatentRecord.id),
            )
            .filter(
                or_(
                    PatentRecord.assignee_normalized == assignee_name,
                    PatentRecord.assignee == assignee_name,
                ),
                PatentRecord.patent_classification.isnot(None),
            )
            .group_by(PatentRecord.patent_classification)
            .order_by(desc(func.count(PatentRecord.id)))
            .first()
        )
        primary_class = dominant_class_row[0] if dominant_class_row else None

        results.append({
            "assignee": assignee_name,
            "patent_count": patent_count,
            "citation_count": citations,
            "filing_timeline": timeline,
            "domain_distribution": domains,
            "primary_classification": primary_class,
        })

    return results


def get_innovation_map(
    db: Session,
    domain_filter: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Innovation Mapping: connects Technology Domain -> Patent Classification -> Assignee.
    Shows where patent activity is concentrated in the database.
    """
    domain_q = (
        db.query(
            PatentRecord.technology_domain,
            func.count(PatentRecord.id).label("count"),
        )
        .filter(PatentRecord.technology_domain.isnot(None))
    )

    if domain_filter and domain_filter.strip() and domain_filter.strip().upper() != "ALL":
        domain_q = domain_q.filter(PatentRecord.technology_domain == domain_filter.strip())

    top_domains = (
        domain_q.group_by(PatentRecord.technology_domain)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )

    nodes: list[dict[str, Any]] = []

    for d_row in top_domains:
        domain_name = d_row[0]
        p_count = int(d_row[1])

        # Top classifications in this domain
        class_rows = (
            db.query(
                PatentRecord.patent_classification,
                func.count(PatentRecord.id).label("c_count"),
            )
            .filter(
                PatentRecord.technology_domain == domain_name,
                PatentRecord.patent_classification.isnot(None),
            )
            .group_by(PatentRecord.patent_classification)
            .order_by(desc("c_count"))
            .limit(6)
            .all()
        )
        top_classes = [{"classification": str(c[0]), "count": int(c[1])} for c in class_rows]

        # Top assignees in this domain
        assignee_rows = (
            db.query(
                func.coalesce(PatentRecord.assignee_normalized, PatentRecord.assignee).label("a_name"),
                func.count(PatentRecord.id).label("a_count"),
            )
            .filter(
                PatentRecord.technology_domain == domain_name,
                PatentRecord.assignee.isnot(None),
            )
            .group_by("a_name")
            .order_by(desc("a_count"))
            .limit(6)
            .all()
        )
        top_assignees = [{"assignee": str(a[0]), "count": int(a[1])} for a in assignee_rows]

        nodes.append({
            "domain": domain_name,
            "patent_count": p_count,
            "top_classifications": top_classes,
            "top_assignees": top_assignees,
        })

    return nodes


def get_all_patents_for_clustering(
    db: Session,
    domain_filter: Optional[str] = None,
    limit: int = 500,
) -> list[PatentRecord]:
    """Retrieve real patent records with texts for clustering."""
    q = db.query(PatentRecord)
    if domain_filter and domain_filter.strip() and domain_filter.strip().upper() != "ALL":
        q = q.filter(PatentRecord.technology_domain == domain_filter.strip())
    return q.order_by(PatentRecord.filing_date.desc().nullslast(), PatentRecord.id.desc()).limit(limit).all()


def update_patent_clusters(
    db: Session,
    cluster_assignments: dict[int, tuple[int, str]],
) -> None:
    """Save cluster_id and cluster_label back to patent_records in batch."""
    for patent_id, (c_id, c_label) in cluster_assignments.items():
        db.query(PatentRecord).filter(PatentRecord.id == patent_id).update({
            "cluster_id": c_id,
            "cluster_label": c_label,
            "updated_at": datetime.utcnow(),
        }, synchronize_session=False)
    db.commit()
