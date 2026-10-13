"""
CORE Open Access Research API Adapter
Fetches open-access papers, direct repository full-text links, and publisher outputs.
"""
from typing import Optional, List, Dict, Any
from app.services.research.base_adapter import BaseResearchAdapter
from app.services.research.schemas import NormalizedPaper, ProviderStatus
from app.core.config import get_settings


class CoreAdapter(BaseResearchAdapter):
    def __init__(self):
        super().__init__(
            provider_id="core",
            name="CORE",
            requires_key=True,
            timeout_seconds=9.0,
        )
        self.base_url = "https://api.core.ac.uk/v3/search/works"
        self.paper_url = "https://api.core.ac.uk/v3/works"

    def is_configured(self) -> bool:
        settings = get_settings()
        return bool(settings.CORE_API_KEY)

    def _normalize_item(self, item: Dict[str, Any]) -> NormalizedPaper:
        raw_id = str(item.get("id", ""))
        
        # Authors
        authors = []
        for author in item.get("authors", []):
            if isinstance(author, dict):
                name = author.get("name")
            else:
                name = str(author)
            if name:
                authors.append(name.strip())

        # DOI
        doi = item.get("doi")
        if doi:
            doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "").strip()

        # URLs & Open Access
        download_url = item.get("downloadUrl")
        links = item.get("links", [])
        paper_url = download_url or (links[0] if links else None) or (f"https://core.ac.uk/works/{raw_id}" if raw_id else None)

        year = item.get("yearPublished")
        pub_date = item.get("publishedDate") or (f"{year}-01-01" if year else None)

        journals = item.get("journals") or []
        journal = journals[0].get("title") if journals and isinstance(journals[0], dict) else None

        subjects = item.get("subjects") or []
        keywords = [str(s) for s in subjects if s][:8]

        return NormalizedPaper(
            id=f"paper-core-{raw_id}",
            external_id=raw_id,
            source="CORE",
            title=item.get("title") or "Untitled Publication",
            authors=authors,
            abstract=item.get("abstract"),
            publication_date=pub_date,
            publication_year=year,
            journal=journal,
            conference=None,
            doi=doi or None,
            paper_url=paper_url,
            open_access_url=download_url or paper_url,
            is_open_access=True,  # CORE specializes in Open Access research
            keywords=keywords,
            citation_count=item.get("citationCount"),
            reference_count=None,
            provenance={
                "provider": "CORE",
                "core_id": raw_id,
                "oai": item.get("oai"),
                "download_url": download_url,
            },
        )

    async def search(self, query: str, limit: int = 10, **kwargs) -> List[NormalizedPaper]:
        settings = get_settings()
        if not settings.CORE_API_KEY:
            return []

        headers = {
            "Authorization": f"Bearer {settings.CORE_API_KEY}",
        }
        params = {
            "q": query,
            "limit": min(limit, 25),
        }

        response = await self._request_with_retry("GET", self.base_url, params=params, headers=headers, follow_redirects=True)
        if not response or response.status_code != 200:
            return []

        data = response.json()
        results = data.get("results", [])
        papers = []
        for item in results:
            try:
                papers.append(self._normalize_item(item))
            except Exception as err:
                self.last_error = f"CORE item normalization error: {err}"
                continue
        return papers

    async def get_paper(self, external_id: str) -> Optional[NormalizedPaper]:
        settings = get_settings()
        if not settings.CORE_API_KEY:
            return None

        headers = {"Authorization": f"Bearer {settings.CORE_API_KEY}"}
        url = f"{self.paper_url}/{external_id}"

        response = await self._request_with_retry("GET", url, headers=headers, follow_redirects=True)
        if not response or response.status_code != 200:
            return None
        return self._normalize_item(response.json())

    def get_status(self) -> ProviderStatus:
        configured = self.is_configured()
        return ProviderStatus(
            provider_id=self.provider_id,
            name=self.name,
            is_configured=configured,
            requires_key=self.requires_key,
            status="operational" if configured else "unconfigured",
            features=["open_access_fulltext", "direct_pdf_download", "oai_identifiers"],
            rate_limit_info="150 requests/minute with API key",
            last_error=self.last_error,
        )
