"""
Crossref Research API Adapter
Fetches official DOI records, publisher metadata, author registries, and citation linkages.
"""
from typing import Optional, List, Dict, Any
from app.services.research.base_adapter import BaseResearchAdapter
from app.services.research.schemas import NormalizedPaper, ProviderStatus
from app.core.config import get_settings


class CrossrefAdapter(BaseResearchAdapter):
    def __init__(self):
        super().__init__(
            provider_id="crossref",
            name="Crossref",
            requires_key=False,  # Polite pool uses mailto header
            timeout_seconds=8.0,
        )
        self.base_url = "https://api.crossref.org/works"

    def is_configured(self) -> bool:
        return True  # Crossref polite pool is always available

    def _normalize_item(self, item: Dict[str, Any]) -> NormalizedPaper:
        doi = item.get("DOI", "").strip()
        raw_id = doi.replace("/", "_") if doi else str(hash(item.get("title", [""])[0]))

        # Title
        titles = item.get("title", [])
        title = titles[0] if isinstance(titles, list) and titles else (str(titles) if titles else "Untitled Publication")

        # Authors
        authors = []
        for author in item.get("author", []):
            given = author.get("given", "").strip()
            family = author.get("family", "").strip()
            full_name = f"{given} {family}".strip()
            if full_name:
                authors.append(full_name)

        # Journal / Conference
        containers = item.get("container-title", [])
        journal = containers[0] if isinstance(containers, list) and containers else None

        # Date / Year
        date_parts = None
        for date_field in ["published-print", "published-online", "published", "created"]:
            field_data = item.get(date_field, {})
            parts = field_data.get("date-parts")
            if parts and isinstance(parts, list) and parts[0]:
                date_parts = parts[0]
                break

        year = date_parts[0] if date_parts and len(date_parts) > 0 else None
        month = f"{date_parts[1]:02d}" if date_parts and len(date_parts) > 1 and date_parts[1] else "01"
        day = f"{date_parts[2]:02d}" if date_parts and len(date_parts) > 2 and date_parts[2] else "01"
        pub_date = f"{year}-{month}-{day}" if year else None

        # Subjects
        subjects = item.get("subject", [])
        keywords = [str(s) for s in subjects if s][:8]

        paper_url = item.get("URL") or (f"https://doi.org/{doi}" if doi else None)

        return NormalizedPaper(
            id=f"paper-crossref-{raw_id}",
            external_id=doi or raw_id,
            source="Crossref",
            title=title,
            authors=authors,
            abstract=None,  # Crossref metadata standard typically does not distribute abstracts
            publication_date=pub_date,
            publication_year=year,
            journal=journal,
            conference=item.get("event", {}).get("name") if "event" in item else None,
            doi=doi or None,
            paper_url=paper_url,
            open_access_url=None,
            is_open_access=False,
            keywords=keywords,
            citation_count=item.get("is-referenced-by-count"),
            reference_count=item.get("references-count"),
            provenance={
                "provider": "Crossref",
                "doi": doi,
                "publisher": item.get("publisher"),
                "type": item.get("type"),
            },
        )

    async def search(self, query: str, limit: int = 10, **kwargs) -> List[NormalizedPaper]:
        settings = get_settings()
        mailto = settings.CROSSREF_MAILTO or "researcher@platform.org"

        params = {
            "query": query,
            "rows": min(limit, 25),
            "mailto": mailto,
        }
        headers = {
            "User-Agent": f"ResearchPlatform/2.0 (mailto:{mailto})",
        }

        response = await self._request_with_retry("GET", self.base_url, params=params, headers=headers)
        if not response or response.status_code != 200:
            return []

        data = response.json()
        items = data.get("message", {}).get("items", [])
        papers = []
        for item in items:
            try:
                papers.append(self._normalize_item(item))
            except Exception as err:
                self.last_error = f"Crossref item normalization error: {err}"
                continue
        return papers

    async def get_paper(self, external_id: str) -> Optional[NormalizedPaper]:
        settings = get_settings()
        mailto = settings.CROSSREF_MAILTO or "researcher@platform.org"
        clean_doi = external_id.replace("https://doi.org/", "").strip()
        url = f"{self.base_url}/{clean_doi}"

        headers = {
            "User-Agent": f"ResearchPlatform/2.0 (mailto:{mailto})",
        }
        params = {"mailto": mailto}

        response = await self._request_with_retry("GET", url, params=params, headers=headers)
        if not response or response.status_code != 200:
            return None
        return self._normalize_item(response.json().get("message", {}))

    def get_status(self) -> ProviderStatus:
        return ProviderStatus(
            provider_id=self.provider_id,
            name=self.name,
            is_configured=True,
            requires_key=self.requires_key,
            status="operational",
            features=["doi_resolution", "publisher_metadata", "author_registry", "citations"],
            rate_limit_info="Polite pool: 50 requests/sec with mailto identification",
            last_error=self.last_error,
        )
