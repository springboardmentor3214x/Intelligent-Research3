"""
Semantic Scholar Research API Adapter
Fetches peer-reviewed paper metadata, abstracts, citation counts, and references.
"""
from typing import Optional, List, Dict, Any
from app.services.research.base_adapter import BaseResearchAdapter
from app.services.research.schemas import NormalizedPaper, ProviderStatus
from app.core.config import get_settings


class SemanticScholarAdapter(BaseResearchAdapter):
    def __init__(self):
        super().__init__(
            provider_id="semantic_scholar",
            name="Semantic Scholar",
            requires_key=True,
            timeout_seconds=8.0,
        )
        self.search_url = "https://api.semanticscholar.org/graph/v1/paper/search"
        self.paper_url = "https://api.semanticscholar.org/graph/v1/paper"
        self.fields = (
            "paperId,title,abstract,authors,year,publicationDate,venue,journal,"
            "externalIds,url,isOpenAccess,openAccessPdf,citationCount,referenceCount,fieldsOfStudy"
        )

    def is_configured(self) -> bool:
        settings = get_settings()
        return bool(settings.SEMANTIC_SCHOLAR_API_KEY)

    def _normalize_item(self, item: Dict[str, Any]) -> NormalizedPaper:
        paper_id = item.get("paperId", "")
        authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
        ext_ids = item.get("externalIds") or {}
        doi = ext_ids.get("DOI")
        if doi:
            doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "").strip()

        oa_pdf = item.get("openAccessPdf") or {}
        oa_url = oa_pdf.get("url")

        journal_info = item.get("journal") or {}
        journal = journal_info.get("name") or item.get("venue")

        fields = item.get("fieldsOfStudy") or []
        keywords = [str(f) for f in fields if f][:8]

        year = item.get("year")
        pub_date = item.get("publicationDate") or (f"{year}-01-01" if year else None)

        return NormalizedPaper(
            id=f"paper-s2-{paper_id}",
            external_id=paper_id,
            source="Semantic Scholar",
            title=item.get("title") or "Untitled Publication",
            authors=authors,
            abstract=item.get("abstract"),
            publication_date=pub_date,
            publication_year=year,
            journal=journal,
            conference=item.get("venue"),
            doi=doi,
            paper_url=item.get("url") or (f"https://www.semanticscholar.org/paper/{paper_id}" if paper_id else None),
            open_access_url=oa_url,
            is_open_access=bool(item.get("isOpenAccess")),
            keywords=keywords,
            citation_count=item.get("citationCount"),
            reference_count=item.get("referenceCount"),
            provenance={
                "provider": "Semantic Scholar",
                "paper_id": paper_id,
                "external_ids": ext_ids,
                "fields_of_study": keywords,
            },
        )

    async def search(self, query: str, limit: int = 10, **kwargs) -> List[NormalizedPaper]:
        settings = get_settings()
        headers = {}
        if settings.SEMANTIC_SCHOLAR_API_KEY:
            headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

        params = {
            "query": query,
            "limit": min(limit, 25),
            "fields": self.fields,
        }

        response = await self._request_with_retry("GET", self.search_url, params=params, headers=headers)
        if not response or response.status_code != 200:
            return []

        data = response.json()
        results = data.get("data", [])
        papers = []
        for item in results:
            try:
                papers.append(self._normalize_item(item))
            except Exception as err:
                self.last_error = f"Semantic Scholar item normalization error: {err}"
                continue
        return papers

    async def get_paper(self, external_id: str) -> Optional[NormalizedPaper]:
        settings = get_settings()
        headers = {}
        if settings.SEMANTIC_SCHOLAR_API_KEY:
            headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

        url = f"{self.paper_url}/{external_id}"
        params = {"fields": self.fields}

        response = await self._request_with_retry("GET", url, params=params, headers=headers)
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
            features=["title_search", "abstracts", "citations", "references", "fields_of_study"],
            rate_limit_info="100 requests/5 minutes with API key",
            last_error=self.last_error,
        )
