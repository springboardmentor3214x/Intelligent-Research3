"""
Research Paper Deduplication and Provenance Reconciliation
Implements strict matching priority:
1. Normalized DOI
2. Provider cross-identifiers
3. Normalized Title + Author Surname Overlap + Publication Year Proximity (<= 1 year)
"""
import re
from typing import List, Dict, Optional, Set
from app.services.research.schemas import NormalizedPaper


def normalize_doi(doi: Optional[str]) -> Optional[str]:
    if not doi:
        return None
    cleaned = (
        doi.lower()
        .replace("https://doi.org/", "")
        .replace("http://doi.org/", "")
        .replace("http://dx.doi.org/", "")
        .replace("doi:", "")
        .strip()
    )
    return cleaned if len(cleaned) > 4 else None


def normalize_title(title: str) -> str:
    if not title:
        return ""
    # Remove punctuation, lowercase, normalize whitespace
    cleaned = re.sub(r"[^\w\s]", "", title.lower())
    return " ".join(cleaned.split())


def extract_surnames(authors: List[str]) -> Set[str]:
    surnames = set()
    for a in authors:
        parts = a.strip().split()
        if parts:
            surnames.add(parts[-1].lower())
    return surnames


def are_records_duplicate(p1: NormalizedPaper, p2: NormalizedPaper) -> bool:
    doi1 = normalize_doi(p1.doi)
    doi2 = normalize_doi(p2.doi)

    # 1. Normalized DOI match
    if doi1 and doi2 and doi1 == doi2:
        return True

    # 2. Check cross-identifiers in provenance
    ext1 = p1.provenance.get("external_ids", {})
    ext2 = p2.provenance.get("external_ids", {})
    if ext1 and ext2:
        for k in ["DOI", "ArXiv", "PubMed"]:
            if k in ext1 and k in ext2 and ext1[k] and ext1[k] == ext2[k]:
                return True

    # 3. Normalized Title + Author + Publication Year
    t1 = normalize_title(p1.title)
    t2 = normalize_title(p2.title)

    if t1 and t2 and (t1 == t2 or (len(t1) > 25 and (t1 in t2 or t2 in t1))):
        # Must have author overlap if authors are available
        surnames1 = extract_surnames(p1.authors)
        surnames2 = extract_surnames(p2.authors)
        author_match = bool(surnames1 & surnames2) if (surnames1 and surnames2) else True

        # Year similarity: within 1 year or unknown
        y1 = p1.publication_year
        y2 = p2.publication_year
        year_match = True
        if y1 and y2:
            year_match = abs(y1 - y2) <= 1

        if author_match and year_match:
            return True

    return False


def merge_two_papers(primary: NormalizedPaper, secondary: NormalizedPaper) -> NormalizedPaper:
    """
    Merges complementary metadata while preserving source provenance.
    """
    # Prefer longer abstract
    chosen_abstract = primary.abstract
    if not chosen_abstract or (secondary.abstract and len(secondary.abstract) > len(chosen_abstract)):
        chosen_abstract = secondary.abstract

    # Combine authors preserving uniqueness
    combined_authors = list(primary.authors)
    for a in secondary.authors:
        if a not in combined_authors:
            combined_authors.append(a)

    # Best publication date
    pub_date = primary.publication_date or secondary.publication_date
    pub_year = primary.publication_year or secondary.publication_year

    # Best venue
    journal = primary.journal or secondary.journal
    conference = primary.conference or secondary.conference

    # Canonical DOI
    doi = normalize_doi(primary.doi) or normalize_doi(secondary.doi)

    # Open Access
    is_oa = primary.is_open_access or secondary.is_open_access
    oa_url = primary.open_access_url or secondary.open_access_url

    # Keywords union
    keywords_set = set(primary.keywords) | set(secondary.keywords)
    merged_keywords = sorted(list(keywords_set))

    # Citations: track by source and take maximum
    citations_by_source = primary.provenance.get("citations_by_source", {})
    if primary.citation_count is not None:
        citations_by_source[primary.source] = primary.citation_count
    if secondary.citation_count is not None:
        citations_by_source[secondary.source] = secondary.citation_count

    max_citations = None
    if citations_by_source:
        max_citations = max(citations_by_source.values())

    # Build merged provenance trace
    merged_sources = set(primary.provenance.get("merged_sources", [primary.source]))
    merged_sources.add(secondary.source)

    updated_provenance = {
        **primary.provenance,
        "merged_sources": sorted(list(merged_sources)),
        "citations_by_source": citations_by_source,
        f"secondary_{secondary.source.lower().replace(' ', '_')}_id": secondary.external_id,
    }

    return NormalizedPaper(
        id=primary.id,
        external_id=primary.external_id,
        source=f"{primary.source} (+{len(merged_sources)-1} sources)" if len(merged_sources) > 1 else primary.source,
        title=primary.title if len(primary.title) >= len(secondary.title) else secondary.title,
        authors=combined_authors,
        abstract=chosen_abstract,
        publication_date=pub_date,
        publication_year=pub_year,
        journal=journal,
        conference=conference,
        doi=doi,
        paper_url=primary.paper_url or secondary.paper_url,
        open_access_url=oa_url,
        is_open_access=is_oa,
        keywords=merged_keywords,
        citation_count=max_citations,
        reference_count=primary.reference_count or secondary.reference_count,
        retrieved_timestamp=primary.retrieved_timestamp,
        provenance=updated_provenance,
    )


def deduplicate_papers(papers: List[NormalizedPaper]) -> List[NormalizedPaper]:
    """
    Deduplicates a list of multi-provider papers using matching hierarchy.
    """
    if not papers:
        return []

    unique_papers: List[NormalizedPaper] = []

    for candidate in papers:
        matched_idx = None
        for idx, existing in enumerate(unique_papers):
            if are_records_duplicate(candidate, existing):
                matched_idx = idx
                break

        if matched_idx is not None:
            # Merge complementary metadata into existing record
            unique_papers[matched_idx] = merge_two_papers(unique_papers[matched_idx], candidate)
        else:
            unique_papers.append(candidate)

    return unique_papers
