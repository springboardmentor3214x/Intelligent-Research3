"""
Central Research Intelligence Search & Analytics Orchestrator
Coordinates multi-provider parallel querying, caching, deduplication, and trend analysis.
"""
import time
import asyncio
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime

from app.services.research.schemas import (
    NormalizedPaper,
    SearchResponse,
    TrendsResponse,
    TopicTrend,
    ProviderStatusList,
)
from app.services.research.cache import (
    research_search_cache,
    research_paper_cache,
    research_trends_cache,
)
from app.services.research.deduplication import deduplicate_papers
from app.services.research.adapters.openalex_adapter import OpenAlexAdapter
from app.services.research.adapters.semantic_scholar_adapter import SemanticScholarAdapter
from app.services.research.adapters.crossref_adapter import CrossrefAdapter
from app.services.research.adapters.core_adapter import CoreAdapter
from app.services.research.adapters.serpapi_adapter import SerpApiScholarAdapter

logger = logging.getLogger("research.service")


class ResearchSearchService:
    def __init__(self):
        self.adapters = {
            "openalex": OpenAlexAdapter(),
            "semantic_scholar": SemanticScholarAdapter(),
            "crossref": CrossrefAdapter(),
            "core": CoreAdapter(),
            "serpapi": SerpApiScholarAdapter(),
        }

    def get_providers_status(self) -> ProviderStatusList:
        statuses = [adapter.get_status() for adapter in self.adapters.values()]
        active_count = sum(1 for s in statuses if s.is_configured)
        return ProviderStatusList(
            providers=statuses,
            active_providers_count=active_count,
            total_providers_count=len(statuses),
        )

    def _resolve_target_adapters(self, sources: List[str]):
        """Map user-requested source names to adapter instances."""
        normalized_sources = [s.lower().replace(" ", "_") for s in sources]
        if "all" in normalized_sources or not normalized_sources:
            # Query all configured adapters
            return [a for a in self.adapters.values() if a.is_configured()]

        targets = []
        for key in normalized_sources:
            if key in self.adapters and self.adapters[key].is_configured():
                targets.append(self.adapters[key])
            elif key == "google_scholar" and "serpapi" in self.adapters:
                targets.append(self.adapters["serpapi"])
        return targets if targets else [a for a in self.adapters.values() if a.is_configured()]

    async def search_papers(
        self,
        query: str,
        sources: Optional[List[str]] = None,
        limit: int = 15,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
    ) -> SearchResponse:
        start_time = time.time()
        active_sources = sources or ["all"]
        cache_key = f"search:{query}:{','.join(sorted(active_sources))}:{limit}:{year_min}:{year_max}"

        # 1. Check Cache
        cached_result = await research_search_cache.get(cache_key)
        if cached_result:
            return cached_result

        target_adapters = self._resolve_target_adapters(active_sources)
        sources_queried = [a.name for a in target_adapters]

        # 2. Parallel Bounded Execution
        async def fetch_from_adapter(adapter):
            try:
                per_provider_limit = min(limit, 15)
                res = await adapter.search(query, limit=per_provider_limit)
                return adapter.name, res, None
            except Exception as e:
                logger.error(f"Error querying {adapter.name}: {e}")
                return adapter.name, [], str(e)

        tasks = [fetch_from_adapter(adapter) for adapter in target_adapters]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        raw_papers: List[NormalizedPaper] = []
        sources_succeeded: List[str] = []
        sources_failed: List[str] = []

        for item in results:
            if isinstance(item, Exception):
                continue
            name, papers, err = item
            if err:
                sources_failed.append(name)
            else:
                sources_succeeded.append(name)
                raw_papers.extend(papers)

        # 3. Deduplication and Normalization
        deduped = deduplicate_papers(raw_papers)

        # 4. Filters (Year range)
        filtered = []
        for p in deduped:
            if year_min and p.publication_year and p.publication_year < year_min:
                continue
            if year_max and p.publication_year and p.publication_year > year_max:
                continue
            filtered.append(p)

        # Sort: Papers with citation counts and recent years first
        filtered.sort(
            key=lambda p: (
                p.citation_count or 0,
                p.publication_year or 0,
            ),
            reverse=True,
        )

        final_papers = filtered[:limit]
        elapsed = round((time.time() - start_time) * 1000, 2)

        response = SearchResponse(
            query=query,
            total_results=len(final_papers),
            sources_queried=sources_queried,
            sources_succeeded=sources_succeeded,
            sources_failed=sources_failed,
            execution_time_ms=elapsed,
            papers=final_papers,
        )

        # Store in cache
        await research_search_cache.set(cache_key, response)
        return response

    async def get_paper_by_doi(self, doi: str) -> Optional[NormalizedPaper]:
        """Fetch canonical paper across Crossref, Semantic Scholar, OpenAlex, and CORE by DOI."""
        cache_key = f"doi:{doi}"
        cached = await research_paper_cache.get(cache_key)
        if cached:
            return cached

        # Check Crossref first for authoritative publication record
        crossref = self.adapters.get("crossref")
        s2 = self.adapters.get("semantic_scholar")
        openalex = self.adapters.get("openalex")

        paper = None
        if crossref:
            paper = await crossref.get_paper(doi)

        if not paper and s2:
            paper = await s2.get_paper(f"DOI:{doi}")

        if not paper and openalex:
            paper = await openalex.get_paper(f"https://doi.org/{doi}")

        if paper:
            await research_paper_cache.set(cache_key, paper)
        return paper

    async def calculate_trends(self, domain: str, years: int = 5) -> TrendsResponse:
        """
        Computes measurable publication velocity, citation averages,
        and topic evolution across multi-source indexed papers.
        """
        cache_key = f"trends:{domain}:{years}"
        cached = await research_trends_cache.get(cache_key)
        if cached:
            return cached

        # Search papers in domain
        search_res = await self.search_papers(query=domain, limit=30)
        papers = search_res.papers

        current_year = datetime.utcnow().year
        min_year = current_year - years + 1

        year_dist: Dict[str, int] = {str(y): 0 for y in range(min_year, current_year + 1)}
        citations_dist: Dict[str, int] = {str(y): 0 for y in range(min_year, current_year + 1)}
        topic_counts: Dict[str, int] = {}
        oa_count = 0

        for p in papers:
            yr = p.publication_year
            if yr and str(yr) in year_dist:
                year_dist[str(yr)] += 1
                if p.citation_count:
                    citations_dist[str(yr)] += p.citation_count
            if p.is_open_access:
                oa_count += 1

            for kw in p.keywords:
                if len(kw) > 2:
                    topic_counts[kw] = topic_counts.get(kw, 0) + 1

        # Calculate top topics with empirical counts
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        top_topics = [
            TopicTrend(topic=t, count=c, growth_rate=round(c / max(len(papers), 1), 2))
            for t, c in sorted_topics
        ]

        oa_ratio = round(oa_count / len(papers), 2) if papers else 0.0

        response = TrendsResponse(
            domain=domain,
            analysis_period=f"{min_year} - {current_year}",
            total_publications_analyzed=len(papers),
            year_distribution=year_dist,
            top_topics=top_topics,
            citations_by_year=citations_dist,
            open_access_ratio=oa_ratio,
            data_sources=search_res.sources_succeeded,
            retrieved_timestamp=datetime.utcnow().isoformat() + "Z",
            methodology="Empirical cross-provider bibliometric aggregation across OpenAlex, Semantic Scholar, Crossref, and CORE indices.",
        )

        await research_trends_cache.set(cache_key, response)
        return response

    async def get_recommendations_for_profile(
        self,
        domain: str,
        keywords: List[str],
        areas: List[str],
        limit: int = 10,
    ) -> List[NormalizedPaper]:
        """
        Module 2 Integration: Generates customized paper recommendations
        using the active researcher's domain, research areas, and keywords.
        """
        query_parts = []
        if domain:
            query_parts.append(domain)
        if areas:
            query_parts.extend(areas[:2])
        if keywords:
            query_parts.extend(keywords[:3])

        query = " ".join(query_parts) if query_parts else "Artificial Intelligence"
        search_res = await self.search_papers(query=query, limit=limit)
        return search_res.papers


# Global service singleton
research_search_service = ResearchSearchService()
