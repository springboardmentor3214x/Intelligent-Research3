"""
Patent Landscape Service — Module 5.

Orchestrator for patent search, provider synchronization, trend analysis,
competitor intelligence, ML clustering, and innovation mapping.
"""

import logging
import math
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.patent_landscape import PatentRecord
from app.repositories.patent_repository import (
    create_or_update_patent,
    get_competitor_analysis as repo_competitors,
    get_innovation_map as repo_innovation_map,
    get_patent_by_id,
    get_patent_trends as repo_trends,
    search_patents as repo_search,
)
from app.schemas.patent import (
    CompetitorItem,
    CompetitorResponse,
    DomainAssigneeNode,
    DomainClassificationNode,
    InnovationDomainNode,
    InnovationMapResponse,
    PatentClustersResponse,
    PatentPaginatedResponse,
    PatentRecordOut,
    PatentSyncSummary,
    PatentTrendPoint,
    PatentTrendResponse,
)
from app.services.patent_clustering_service import run_patent_clustering
from app.services.patent_sources.lens_client import LensPatentClient
from app.services.patent_sources.normalizer import (
    normalize_lens_record,
    normalize_serpapi_record,
    normalize_uspto_record,
)
from app.services.patent_sources.serpapi_client import SerpApiGooglePatentsClient
from app.services.patent_sources.uspto_client import USPTOPatentClient

logger = logging.getLogger(__name__)


class PatentLandscapeService:
    """Core service for Module 5 Patent Landscape Analysis."""

    def __init__(self):
        self.settings = get_settings()
        self.serpapi_client = SerpApiGooglePatentsClient()
        self.uspto_client = USPTOPatentClient()
        self.lens_client = LensPatentClient()

    # -----------------------------------------------------------------------
    # 1. Patent Search & Filtering
    # -----------------------------------------------------------------------
    def search_patents(
        self,
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
    ) -> PatentPaginatedResponse:
        # Live SerpApi Google Patents Search
        if keyword and keyword.strip() and self.serpapi_client.is_configured():
            try:
                raw_results = self.serpapi_client.search(
                    query=keyword.strip(),
                    page=page,
                    per_page=page_size,
                )
                for raw in raw_results:
                    norm = normalize_serpapi_record(raw)
                    if norm:
                        create_or_update_patent(db, norm)
            except Exception as e:
                logger.error(f"Live SerpApi patent search error: {e}")

        items, total = repo_search(
            db=db,
            keyword=keyword,
            assignee=assignee,
            domain=domain,
            classification=classification,
            filing_year_min=filing_year_min,
            filing_year_max=filing_year_max,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        # Transform to Pydantic models
        out_items = [PatentRecordOut.model_validate(p) for p in items]

        return PatentPaginatedResponse(
            items=out_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # -----------------------------------------------------------------------
    # 2. Single Patent Detail
    # -----------------------------------------------------------------------
    def get_patent(self, db: Session, patent_id: int) -> Optional[PatentRecordOut]:
        p = get_patent_by_id(db, patent_id)
        if not p:
            return None

        # Fetch rich details via SerpApi google_patents_details if configured
        if self.serpapi_client.is_configured():
            search_id = p.source_patent_id or p.patent_number
            if search_id:
                try:
                    details = self.serpapi_client.get_details(search_id)
                    if details:
                        changed = False
                        if details.get("abstract") and not p.abstract:
                            p.abstract = details["abstract"]
                            changed = True
                        if details.get("claims") and not p.claims_text:
                            claims = details["claims"]
                            p.claims_text = "\n\n".join(claims) if isinstance(claims, list) else str(claims)
                            changed = True
                        if details.get("cited_by"):
                            cited_by = details["cited_by"]
                            c_count = len(cited_by.get("original", [])) if isinstance(cited_by, dict) else (len(cited_by) if isinstance(cited_by, list) else 0)
                            if c_count > (p.citation_count or 0):
                                p.citation_count = c_count
                                changed = True
                        if details.get("classifications") and not p.all_classifications:
                            c_list = [c.get("code") for c in details["classifications"] if isinstance(c, dict) and c.get("code")]
                            if c_list:
                                import json
                                p.all_classifications = json.dumps(c_list)
                                if not p.patent_classification:
                                    p.patent_classification = c_list[0]
                                changed = True
                        if changed:
                            import json
                            p.raw_metadata = json.dumps(details)
                            db.commit()
                            db.refresh(p)
                except Exception as exc:
                    logger.warning(f"Error enriching patent details from SerpApi: {exc}")

        return PatentRecordOut.model_validate(p)

    # -----------------------------------------------------------------------
    # 3. Patent Sync / Ingestion from Real Source
    # -----------------------------------------------------------------------
    def sync_from_source(
        self,
        db: Session,
        query: str,
        source: Optional[str] = None,
        limit: int = 25,
    ) -> PatentSyncSummary:
        selected_source = (source or self.settings.PATENT_SOURCE or "serpapi").lower()
        summary = PatentSyncSummary(source=selected_source, query=query)

        raw_records = []
        if selected_source in ("serpapi", "google_patents"):
            if self.serpapi_client.is_configured():
                raw_records = self.serpapi_client.search(query=query, per_page=limit)
            else:
                logger.info("SerpApi API key is not configured.")
        elif selected_source == "lens":
            if self.lens_client.is_configured():
                raw_records = self.lens_client.search(query=query, per_page=limit)
            elif self.serpapi_client.is_configured():
                logger.info("Lens API key not configured, automatically routing to Google Patents (SerpApi).")
                raw_records = self.serpapi_client.search(query=query, per_page=limit)
                selected_source = "google_patents"
                summary.source = "google_patents"
            else:
                logger.info("The Lens API key is not configured.")
        else:
            if self.uspto_client.is_configured():
                raw_records = self.uspto_client.search(query=query, per_page=limit)
            elif self.serpapi_client.is_configured():
                logger.info("USPTO API key not configured, automatically routing to Google Patents (SerpApi).")
                raw_records = self.serpapi_client.search(query=query, per_page=limit)
                selected_source = "google_patents"
                summary.source = "google_patents"
            else:
                logger.info("USPTO API key is not configured.")

        summary.fetched = len(raw_records)

        for raw in raw_records:
            try:
                if selected_source in ("serpapi", "google_patents"):
                    norm = normalize_serpapi_record(raw)
                elif selected_source == "lens":
                    norm = normalize_lens_record(raw)
                else:
                    norm = normalize_uspto_record(raw)

                if not norm:
                    summary.failed += 1
                    continue

                _, inserted, updated = create_or_update_patent(db, norm)
                if inserted:
                    summary.inserted += 1
                elif updated:
                    summary.updated += 1
                else:
                    summary.skipped_duplicates += 1
            except Exception as e:
                logger.error(f"Error ingesting patent record: {e}")
                summary.failed += 1

        return summary

    # -----------------------------------------------------------------------
    # 4. Patent Trend Analysis (Filing Date over Time)
    # -----------------------------------------------------------------------
    def get_trends(
        self,
        db: Session,
        domain: Optional[str] = None,
        assignee: Optional[str] = None,
        query: Optional[str] = None,
    ) -> PatentTrendResponse:
        raw_trends = repo_trends(db=db, domain=domain, assignee=assignee, query=query)

        points = [PatentTrendPoint(year=r["year"], count=r["count"]) for r in raw_trends]
        total = sum(p.count for p in points)
        start_year = min((p.year for p in points), default=None)
        end_year = max((p.year for p in points), default=None)

        return PatentTrendResponse(
            trends=points,
            total_patents=total,
            start_year=start_year,
            end_year=end_year,
        )

    # -----------------------------------------------------------------------
    # 5. Competitor Patent Analysis (Assignee Activity)
    # -----------------------------------------------------------------------
    def get_competitor_analysis(
        self,
        db: Session,
        domain: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 10,
    ) -> CompetitorResponse:
        data = repo_competitors(db=db, domain=domain, query=query, limit=limit)
        items = [
            CompetitorItem(
                assignee=d["assignee"],
                patent_count=d["patent_count"],
                citation_count=d["citation_count"],
                filing_timeline=d["filing_timeline"],
                domain_distribution=d["domain_distribution"],
                primary_classification=d["primary_classification"],
            )
            for d in data
        ]
        return CompetitorResponse(competitors=items, total_assignees=len(items))

    # -----------------------------------------------------------------------
    # 6. Innovation Mapping (Domain -> Classification -> Assignee)
    # -----------------------------------------------------------------------
    def get_innovation_map(
        self,
        db: Session,
        domain_filter: Optional[str] = None,
    ) -> InnovationMapResponse:
        raw_nodes = repo_innovation_map(db=db, domain_filter=domain_filter)

        nodes = []
        total_patents = 0
        for r in raw_nodes:
            total_patents += r["patent_count"]
            nodes.append(
                InnovationDomainNode(
                    domain=r["domain"],
                    patent_count=r["patent_count"],
                    top_classifications=[DomainClassificationNode(**c) for c in r["top_classifications"]],
                    top_assignees=[DomainAssigneeNode(**a) for a in r["top_assignees"]],
                )
            )

        return InnovationMapResponse(
            domains=nodes,
            total_patents=total_patents,
            total_domains=len(nodes),
        )

    # -----------------------------------------------------------------------
    # 7. Patent Clustering (Sentence Transformers + Scikit-learn)
    # -----------------------------------------------------------------------
    def run_clustering(
        self,
        db: Session,
        n_clusters: int = 5,
        domain_filter: Optional[str] = None,
        min_patents: int = 5,
    ) -> PatentClustersResponse:
        return run_patent_clustering(
            db=db,
            n_clusters=n_clusters,
            domain_filter=domain_filter,
            min_patents=min_patents,
        )


# Global singleton instance
patent_landscape_service = PatentLandscapeService()
