"""
AI Research Analysis Service — Module 3.

Generates structured analysis of a research paper from its legally available
abstract and metadata.

Analysis strategy (in priority order):
  1. If OPENAI_API_KEY is set in env → use GPT-4o-mini for richer analysis.
  2. Fallback → rule-based extraction from abstract text.

The service NEVER pretends to have the full paper text when it is unavailable.
AI-generated content is clearly labelled in the response.
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Rule-based analysis (always available, no API key required)
# ---------------------------------------------------------------------------

def _sentence_split(text: str) -> list[str]:
    """Split text into sentences, returning non-empty results."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


def _extract_summary(abstract: str, max_sentences: int = 3) -> str:
    """Return the first N sentences as a plain summary."""
    sentences = _sentence_split(abstract)
    return " ".join(sentences[:max_sentences]) if sentences else abstract[:300]


def _extract_problem(abstract: str) -> str:
    """Heuristically find the research problem statement."""
    problem_patterns = [
        r"(?i)(this paper|this work|this study|we address|we present|we propose|we introduce|the problem of|challenge of|addressing|motivated by)[^.]*\.",
        r"(?i)(however|despite|although|while|unfortunately)[^.]*\.",
    ]
    for pattern in problem_patterns:
        match = re.search(pattern, abstract)
        if match:
            return match.group(0).strip()
    sentences = _sentence_split(abstract)
    return sentences[0] if sentences else "See abstract for research problem."


def _extract_methodology(abstract: str) -> str:
    """Heuristically find methodology description."""
    method_patterns = [
        r"(?i)(we (propose|develop|use|apply|introduce|design|employ|implement|adopt)|our (approach|method|framework|model|system|algorithm|technique))[^.]*\.",
        r"(?i)(using|based on|via|through|by means of)[^.]*\.",
    ]
    for pattern in method_patterns:
        match = re.search(pattern, abstract)
        if match:
            return match.group(0).strip()
    sentences = _sentence_split(abstract)
    if len(sentences) >= 2:
        return sentences[1]
    return "Methodology details are described in the abstract."


def _extract_findings(abstract: str) -> list[str]:
    """Heuristically find key findings."""
    findings: list[str] = []
    finding_patterns = [
        r"(?i)(results? (show|indicate|demonstrate|suggest|reveal)|we (show|demonstrate|find|observe|achieve|report))[^.]*\.",
        r"(?i)(outperform|significantly|state.of.the.art|improvement|accuracy|performance)[^.]*\.",
        r"(?i)(experiments?|evaluation|benchmark)[^.]*\.",
    ]
    for pattern in finding_patterns:
        for match in re.finditer(pattern, abstract):
            text = match.group(0).strip()
            if text not in findings and len(text) > 20:
                findings.append(text)
                if len(findings) >= 3:
                    break
    if not findings:
        sentences = _sentence_split(abstract)
        findings = sentences[-2:] if len(sentences) >= 2 else sentences
    return findings[:4]


def _extract_limitations(abstract: str) -> list[str]:
    """Heuristically extract limitations (often not in abstracts)."""
    limitation_patterns = [
        r"(?i)(limitation|constraint|drawback|downside|weakness|caveat|challenge|however|although|despite|not yet)[^.]*\.",
    ]
    limitations: list[str] = []
    for pattern in limitation_patterns:
        for match in re.finditer(pattern, abstract):
            text = match.group(0).strip()
            if text not in limitations and len(text) > 15:
                limitations.append(text)
    if not limitations:
        limitations = [
            "Limitations are not explicitly stated in the available abstract. "
            "Full text analysis would be required for a comprehensive assessment."
        ]
    return limitations[:3]


def _extract_future_directions(abstract: str) -> list[str]:
    """Heuristically extract future work."""
    future_patterns = [
        r"(?i)(future (work|research|direction|study|investigation)|in the future|planned|will be extended|open (problem|question|challenge)|remain to be)[^.]*\.",
    ]
    directions: list[str] = []
    for pattern in future_patterns:
        for match in re.finditer(pattern, abstract):
            text = match.group(0).strip()
            if text not in directions and len(text) > 15:
                directions.append(text)
    if not directions:
        directions = [
            "Future research directions are not explicitly mentioned in the available abstract."
        ]
    return directions[:3]


def _rule_based_analysis(
    title: str,
    abstract: str | None,
    authors: list[str],
    publication_year: int | None,
    research_area: list[str],
    keywords: list[str],
) -> dict[str, Any]:
    """
    Produce structured analysis using rule-based NLP on the abstract.
    Used when no OpenAI key is configured.
    """
    if not abstract:
        return {
            "summary": f"Abstract not available for \"{title}\". Structured analysis cannot be performed without textual content.",
            "problem": "Abstract unavailable.",
            "methodology": "Abstract unavailable.",
            "findings": ["Full text or abstract required for findings extraction."],
            "limitations": ["Abstract unavailable — limitations cannot be assessed."],
            "future_directions": ["Abstract unavailable — future directions cannot be assessed."],
            "analysis_basis": "metadata_only",
            "disclaimer": (
                "This analysis is based solely on available metadata (title, authors, year, "
                "keywords). No abstract was available. This is NOT a full paper analysis."
            ),
        }

    return {
        "summary": _extract_summary(abstract),
        "problem": _extract_problem(abstract),
        "methodology": _extract_methodology(abstract),
        "findings": _extract_findings(abstract),
        "limitations": _extract_limitations(abstract),
        "future_directions": _extract_future_directions(abstract),
        "analysis_basis": "abstract",
        "disclaimer": (
            "This analysis is derived from the legally available abstract only. "
            "It is NOT a full-text analysis. AI-generated interpretations are marked accordingly."
        ),
    }


# ---------------------------------------------------------------------------
# Google Gemini enhancement (gemini-3.5-flash-lite / gemini-3.6-flash)
# ---------------------------------------------------------------------------

def _gemini_analysis(
    title: str,
    abstract: str,
    authors: list[str],
    publication_year: int | None,
    research_area: list[str],
    keywords: list[str],
    api_key: str,
    custom_prompt: str | None = None,
) -> dict[str, Any] | None:
    """
    Use Google Gemini to generate structured research analysis.
    Returns None on failure so caller can fall back to OpenAI or rule-based.
    """
    try:
        import httpx
        import json

        author_str = ", ".join(authors[:5]) if authors else "Unknown"
        area_str = ", ".join(research_area[:5]) if research_area else "Not specified"
        kw_str = ", ".join(keywords[:10]) if keywords else "None"

        focus_instruction = f"\nFocus your analysis particularly on: {custom_prompt}\n" if custom_prompt else ""

        prompt = f"""Analyze the following research paper based ONLY on the provided abstract.
Do not make up information. Be concise and factual.{focus_instruction}

Title: {title}
Authors: {author_str}
Year: {publication_year or 'Unknown'}
Research Areas: {area_str}
Keywords: {kw_str}

Abstract:
{abstract}

Provide a JSON response with these exact keys:
- summary: 2-3 sentence plain-language summary
- problem: the core research problem or gap being addressed
- methodology: the approach or method used
- findings: array of 2-4 key findings or contributions
- limitations: array of 1-3 limitations (if not stated, note that)
- future_directions: array of 1-3 future research directions (if not stated, note that)

Respond with valid JSON only, no markdown."""

        models_to_try = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
            }
            try:
                resp = httpx.post(url, json=payload, timeout=25)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_text = candidates[0]["content"]["parts"][0]["text"]
                        result = json.loads(raw_text)
                        required_keys = {"summary", "problem", "methodology", "findings", "limitations", "future_directions"}
                        if required_keys.issubset(result.keys()):
                            result["analysis_basis"] = "gemini_ai"
                            result["model"] = f"Google {model}"
                            result["disclaimer"] = (
                                f"This analysis was generated by an AI model ({model}) based solely on the "
                                "legally available abstract. It is NOT a full-text analysis. "
                                "AI-generated interpretations should be verified against the original paper."
                            )
                            return result
            except Exception as e:
                logger.debug("Gemini model %s attempt error: %s", model, e)
                continue

        return None
    except Exception as exc:
        logger.warning("Gemini analysis failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Optional GPT-4o-mini enhancement
# ---------------------------------------------------------------------------

def _openai_analysis(
    title: str,
    abstract: str,
    authors: list[str],
    publication_year: int | None,
    research_area: list[str],
    keywords: list[str],
    api_key: str,
    base_url: str | None = None,
    custom_prompt: str | None = None,
) -> dict[str, Any] | None:
    """
    Use OpenAI / compatible API (via httpx) to generate structured analysis.
    Returns None on failure so caller can fall back to Gemini or rule-based.
    """
    try:
        import httpx
        import json

        author_str = ", ".join(authors[:5]) if authors else "Unknown"
        area_str = ", ".join(research_area[:5]) if research_area else "Not specified"
        kw_str = ", ".join(keywords[:10]) if keywords else "None"

        focus_instruction = f"\nFocus your analysis particularly on: {custom_prompt}\n" if custom_prompt else ""

        prompt = f"""Analyze the following research paper based ONLY on the provided abstract.
Do not make up information. Be concise and factual.{focus_instruction}

Title: {title}
Authors: {author_str}
Year: {publication_year or 'Unknown'}
Research Areas: {area_str}
Keywords: {kw_str}

Abstract:
{abstract}

Provide a JSON response with these exact keys:
- summary: 2-3 sentence plain-language summary
- problem: the core research problem or gap being addressed
- methodology: the approach or method used
- findings: array of 2-4 key findings or contributions
- limitations: array of 1-3 limitations (if not stated, note that)
- future_directions: array of 1-3 future research directions (if not stated, note that)

Respond with valid JSON only, no markdown."""

        api_endpoint = (base_url.rstrip("/") if base_url else "https://api.openai.com/v1") + "/chat/completions"
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 800,
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json",
        }

        resp = httpx.post(api_endpoint, json=payload, headers=headers, timeout=30)
        if resp.status_code != 200:
            logger.warning("OpenAI API returned status %d: %s", resp.status_code, resp.text[:200])
            return None

        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        result = json.loads(content)

        # Validate required keys
        required_keys = {"summary", "problem", "methodology", "findings", "limitations", "future_directions"}
        if not required_keys.issubset(result.keys()):
            logger.warning("OpenAI response missing required keys: %s", result.keys())
            return None

        result["analysis_basis"] = "openai_ai"
        result["model"] = "GPT-4o-mini"
        result["disclaimer"] = (
            "This analysis was generated by an AI model (GPT-4o-mini) based solely on the "
            "legally available abstract. It is NOT a full-text analysis. "
            "AI-generated interpretations should be verified against the original paper."
        )
        return result

    except Exception as exc:
        logger.warning("OpenAI analysis failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def analyze_paper(
    title: str,
    abstract: str | None,
    authors: list[str],
    publication_year: int | None,
    research_area: list[str],
    keywords: list[str],
    custom_prompt: str | None = None,
    gemini_api_key: str | None = None,
    openai_api_key: str | None = None,
    openai_api_base: str | None = None,
) -> dict[str, Any]:
    """
    Analyze a research paper and return structured insights.

    Priority:
      1. Google Gemini (gemini-1.5-flash / gemini-2.0-flash)
      2. OpenAI GPT-4o-mini (if key available and abstract exists)
      3. Rule-based extraction from abstract
      4. Metadata-only placeholder (if no abstract)
    """
    # Try Gemini if key is available and abstract exists
    if gemini_api_key and abstract:
        gemini_result = _gemini_analysis(
            title=title,
            abstract=abstract,
            authors=authors,
            publication_year=publication_year,
            research_area=research_area,
            keywords=keywords,
            api_key=gemini_api_key,
            custom_prompt=custom_prompt,
        )
        if gemini_result:
            return gemini_result

    # Try GPT if key is available and abstract exists
    if openai_api_key and abstract:
        gpt_result = _openai_analysis(
            title=title,
            abstract=abstract,
            authors=authors,
            publication_year=publication_year,
            research_area=research_area,
            keywords=keywords,
            api_key=openai_api_key,
            base_url=openai_api_base,
            custom_prompt=custom_prompt,
        )
        if gpt_result:
            return gpt_result

    # Fall back to rule-based
    return _rule_based_analysis(
        title=title,
        abstract=abstract,
        authors=authors,
        publication_year=publication_year,
        research_area=research_area,
        keywords=keywords,
    )
