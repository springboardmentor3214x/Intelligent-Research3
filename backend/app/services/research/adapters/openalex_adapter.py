"""
OpenAlex Research API Adapter
Fetches academic works, authors, institutions, topics, and citation counts.
"""
from typing import Optional, List, Dict, Any
from app.services.research.base_adapter import BaseResearchAdapter
from app.services.research.schemas import NormalizedPaper, ProviderStatus
from app.core.config import get_settings


class OpenAlexAdapter(BaseResearchAdapter):
    def __init__(self):
        super().__init__(
            provider_id="openalex",
            name="OpenAlex",
            requires_key=True,
            timeout_seconds=8.0,
        )
        self.base_url = "https://api.openalex.org/works"

    def is_configured(self) -> bool:
        settings = get_settings()
        return bool(settings.OPENALEX_API_KEY)

    def _reconstruct_abstract(self, inverted_index: Optional[Dict[str, List[int]]]) -> Optional[str]:
        if not inverted_index or not isinstance(inverted_index, dict):
            return None
        try:
            positions = []
            for word, pos_list in inverted_index.items():
                for pos in pos_list:
                    positions.append((pos, word))
            positions.sort(key=lambda x: x[0])
            reconstructed = " ".join(word for _, word in positions).strip()
            return reconstructed if reconstructed else None
        except Exception:
            return None

    def _normalize_item(self, item: Dict[str, Any]) -> NormalizedPaper:
        raw_id = item.get("id", "").replace("https://openalex.org/", "")
        
        # Authors
        authors = []
        for authorship in item.get("authorships", []):
            author_name = authorship.get("author", {}).get("display_name")
            if author_name:
                authors.append(author_name)

        # DOI
        raw_doi = item.get("doi")
        doi = raw_doi.replace("https://doi.org/", "").replace("http://doi.org/", "").strip() if raw_doi else None

        # Abstract
        abstract = self._reconstruct_abstract(item.get("abstract_inverted_index"))

        # Venue / Journal
        primary_loc = item.get("primary_location") or {}
        source_info = primary_loc.get("source") or {}
        journal = source_info.get("display_name") or item.get("host_venue", {}).get("name")
        conference = source_info.get("display_name") if item.get("type") == "proceedings-article" else None

        # Open Access
        oa_info = item.get("open_access") or {}
        is_oa = oa_info.get("is_oa", False)
        oa_url = oa_info.get("oa_url") or primary_loc.get("pdf_url")

        # Keywords / Concepts
        concepts = item.get("concepts", [])
        keywords = [c.get("display_name") for c in concepts if c.get("display_name")][:8]

        # URLs
        paper_url = raw_doi or primary_loc.get("landing_page_url") or (f"https://openalex.org/{raw_id}" if raw_id else None)

        year = item.get("publication_year")
        pub_date = item.get("publication_date") or (f"{year}-01-01" if year else None)

        return NormalizedPaper(
            id=f"paper-openalex-{raw_id}",
            external_id=raw_id,
            source="OpenAlex",
            title=item.get("title") or "Untitled Publication",
            authors=authors,
            abstract=abstract,
            publication_date=pub_date,
            publication_year=year,
            journal=journal,
            conference=conference,
            doi=doi,
            paper_url=paper_url,
            open_access_url=oa_url,
            is_open_access=is_oa,
            keywords=keywords,
            citation_count=item.get("cited_by_count"),
            reference_count=len(item.get("referenced_works", [])) if "referenced_works" in item else None,
            provenance={
                "provider": "OpenAlex",
                "openalex_id": item.get("id"),
                "concepts": keywords,
                "type": item.get("type"),
            },
        )

    async def search(self, query: str, limit: int = 10, **kwargs) -> List[NormalizedPaper]:
        settings = get_settings()
        params = {
            "search": query,
            "per_page": min(limit, 25),
        }
        if settings.OPENALEX_API_KEY:
            params["api_key"] = settings.OPENALEX_API_KEY

        response = await self._request_with_retry("GET", self.base_url, params=params)
        if not response or response.status_code != 200:
            return []

        data = response.json()
        results = data.get("results", [])
        papers = []
        for item in results:
            try:
                papers.append(self._normalize_item(item))
            except Exception as err:
                self.last_error = f"OpenAlex item normalization error: {err}"
                continue
        return papers

    async def get_paper(self, external_id: str) -> Optional[NormalizedPaper]:
        settings = get_settings()
        clean_id = external_id.replace("https://openalex.org/", "").strip()
        url = f"{self.base_url}/{clean_id}"
        params = {}
        if settings.OPENALEX_API_KEY:
            params["api_key"] = settings.OPENALEX_API_KEY

        response = await self._request_with_retry("GET", url, params=params)
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
            features=["keyword_search", "abstract_reconstruction", "citations", "open_access_links", "topics"],
            rate_limit_info="100,000 requests/day with API Key",
            last_error=self.last_error,
        )
