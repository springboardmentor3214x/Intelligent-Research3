"""
SerpApi Google Scholar Engine Adapter
Fetches Google Scholar search results, snippets, and citation metrics.
"""
from typing import Optional, List, Dict, Any
import re
from app.services.research.base_adapter import BaseResearchAdapter
from app.services.research.schemas import NormalizedPaper, ProviderStatus
from app.core.config import get_settings


class SerpApiScholarAdapter(BaseResearchAdapter):
    def __init__(self):
        super().__init__(
            provider_id="serpapi",
            name="Google Scholar (SerpApi)",
            requires_key=True,
            timeout_seconds=10.0,
        )
        self.base_url = "https://serpapi.com/search.json"

    def is_configured(self) -> bool:
        settings = get_settings()
        return bool(settings.SERPAPI_API_KEY)

    def _parse_publication_info(self, summary_text: Optional[str]) -> Dict[str, Any]:
        """
        Parses Google Scholar publication info string such as:
        'A Vaswani, N Shazeer, N Parmar - Advances in neural information ..., 2017 - proceedings.neurips.cc'
        """
        if not summary_text:
            return {"authors": [], "year": None, "venue": None}

        authors = []
        year = None
        venue = None

        parts = summary_text.split(" - ")
        if len(parts) >= 1:
            authors_str = parts[0]
            authors = [a.strip() for a in authors_str.split(",") if a.strip()]

        if len(parts) >= 2:
            venue_year_str = parts[1]
            year_match = re.search(r"\b(19\d\d|20\d\d)\b", venue_year_str)
            if year_match:
                year = int(year_match.group(1))
            venue = re.sub(r",?\s*\b(19\d\d|20\d\d)\b", "", venue_year_str).strip()

        return {"authors": authors, "year": year, "venue": venue}

    def _normalize_item(self, item: Dict[str, Any]) -> NormalizedPaper:
        raw_id = item.get("result_id") or str(hash(item.get("title", "")))
        pub_info = self._parse_publication_info(item.get("publication_info", {}).get("summary"))

        # Citation count
        inline_links = item.get("inline_links", {})
        cited_by = inline_links.get("cited_by", {})
        citations = cited_by.get("total")

        # Open access / PDF links
        resources = item.get("resources", [])
        oa_url = None
        is_oa = False
        if resources and isinstance(resources, list):
            oa_url = resources[0].get("link")
            is_oa = True

        year = pub_info["year"]
        pub_date = f"{year}-01-01" if year else None

        return NormalizedPaper(
            id=f"paper-scholar-{raw_id}",
            external_id=raw_id,
            source="Google Scholar (SerpApi)",
            title=item.get("title") or "Untitled Publication",
            authors=pub_info["authors"],
            abstract=item.get("snippet"),
            publication_date=pub_date,
            publication_year=year,
            journal=pub_info["venue"],
            conference=None,
            doi=None,
            paper_url=item.get("link"),
            open_access_url=oa_url,
            is_open_access=is_oa,
            keywords=[],
            citation_count=citations,
            reference_count=None,
            provenance={
                "provider": "SerpApi (Google Scholar)",
                "result_id": raw_id,
                "publication_info": item.get("publication_info", {}).get("summary"),
            },
        )

    async def search(self, query: str, limit: int = 10, **kwargs) -> List[NormalizedPaper]:
        settings = get_settings()
        if not settings.SERPAPI_API_KEY:
            return []

        params = {
            "engine": "google_scholar",
            "q": query,
            "num": min(limit, 20),
            "api_key": settings.SERPAPI_API_KEY,
        }

        response = await self._request_with_retry("GET", self.base_url, params=params)
        if not response or response.status_code != 200:
            return []

        data = response.json()
        results = data.get("organic_results", [])
        papers = []
        for item in results:
            try:
                papers.append(self._normalize_item(item))
            except Exception as err:
                self.last_error = f"SerpApi item normalization error: {err}"
                continue
        return papers

    def get_status(self) -> ProviderStatus:
        configured = self.is_configured()
        return ProviderStatus(
            provider_id=self.provider_id,
            name=self.name,
            is_configured=configured,
            requires_key=self.requires_key,
            status="operational" if configured else "unconfigured",
            features=["google_scholar_rankings", "citations", "snippet_abstracts", "pdf_discovery"],
            rate_limit_info="Search credits per SerpApi monthly subscription",
            last_error=self.last_error,
        )
