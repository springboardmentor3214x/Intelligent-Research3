from pydantic import BaseModel, Field


class SourceMetadata(BaseModel):
    id: int
    title: str
    authors: list[str]
    publication_year: int | None = None
    doi: str | None = None
    source_url: str | None = None
    content_basis: str


class AIAnalysis(BaseModel):
    summary: str
    problem: str
    methodology: str
    findings: list[str]
    limitations: list[str]
    future_directions: list[str]


class PaperAnalysisResponse(BaseModel):
    source: SourceMetadata
    ai_analysis: AIAnalysis
    provider: str
    fallback_used: bool = False


class TrendPoint(BaseModel):
    year: int
    count: int


class TopicCount(BaseModel):
    topic: str
    paper_count: int


class ResearchFilters(BaseModel):
    research_domain: str | None = None
    research_area: str | None = None
    keyword: str | None = None
    start_year: int | None = Field(default=None, ge=1900, le=2200)
    end_year: int | None = Field(default=None, ge=1900, le=2200)


class OpenAlexPublication(BaseModel):
    openalex_id: str
    title: str
    authors: list[str]
    publication_date: str | None = None
    publication_type: str | None = None
    journal_or_conference: str | None = None
    doi: str | None = None
    publication_link: str | None = None
    cited_by_count: int = 0
    topics: list[str] = []


class OpenAlexPublicationSearchResponse(BaseModel):
    source: str = "OpenAlex"
    query: str
    filters: dict[str, str | int | None]
    total_results: int
    page: int
    per_page: int
    publications: list[OpenAlexPublication]


class TrendResponse(BaseModel):
    filters: ResearchFilters
    publication_trends: list[TrendPoint]
    top_topics: list[TopicCount]
    topic_growth: list[dict]


class EmergingTopic(BaseModel):
    topic: str
    current_count: int
    previous_count: int
    growth: int
    evidence_count: int
    confidence: str
    observation: str


class InsightsResponse(BaseModel):
    metrics: dict
    ai_interpretation: dict


class Recommendation(BaseModel):
    paper_id: int
    title: str
    relevance_score: float
    matched_areas: list[str]
    matched_keywords: list[str]
    reasons: list[str]


class RecommendationsResponse(BaseModel):
    recommendations: list[Recommendation]