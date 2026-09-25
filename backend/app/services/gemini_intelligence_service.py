"""
Gemini Intelligence Service
============================
Integrates Google Gemini Generative Language API with real-time model querying
to generate deep, real-time Technology Intelligence analysis for Module 6.

Uses the user-configured API key (GEMINI_API_KEY / GOOGLE_API_KEY) and falls
back across robust flash-lite endpoints.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# List of models in order of response speed and availability
GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
]

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def get_gemini_api_key() -> str:
    """Return active Gemini API key from settings or fallback."""
    cfg = get_settings()
    return (
        cfg.GEMINI_API_KEY
        or cfg.GOOGLE_API_KEY
        or "REMOVED_SECRET"
    )


async def analyze_technology_with_gemini(
    tech_name: str,
    domain_hint: str | None = None,
    empirical_stats: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """
    Query Google Gemini API in real-time to analyze a technology.
    Returns structured JSON with domain, description, keywords, maturity indicators,
    emerging signals, innovation opportunities, and competitive tracking.
    """
    key = get_gemini_api_key()
    if not key:
        logger.warning("No Gemini API key configured. Skipping Gemini intelligence.")
        return None

    stats_context = ""
    if empirical_stats:
        stats_context = f"\nEmpirical literature data from OpenAlex:\n{json.dumps(empirical_stats, indent=2)}\n"

    prompt = f"""You are a world-class Technology Intelligence and Forecasting AI agent.
Analyze the technology: "{tech_name}".
{f'Domain hint: {domain_hint}' if domain_hint else ''}
{stats_context}
Generate rigorous, factual, real-time technology intelligence in JSON format with NO markdown wrapping.
Required JSON schema:
{{
  "domain": string,
  "description": string (comprehensive 2-3 sentence technical description),
  "keywords": [string, string, ...],
  "related_technologies": [string, string, ...],
  "stage": "Emerging" | "Developing" | "Mature" | "Declining",
  "score": number between 10.0 and 95.0,
  "summary": string (1-2 sentence executive summary of technology maturity and momentum),
  "signals": [string, string, string],
  "indicators": {{
    "researchGrowth": number (0-100),
    "patentGrowth": number (0-100),
    "researchActivity": number (0-100),
    "patentActivity": number (0-100),
    "organizationParticipation": number (0-100),
    "applicationDiversity": number (0-100)
  }},
  "adoption": {{
    "level": "Low" | "Medium" | "High",
    "trend": "Increasing" | "Stable" | "Decreasing"
  }},
  "opportunities": [
    {{
      "opportunity_type": "Market Gap" | "Research Breakthrough" | "Patent Vacuum" | "Commercialization" | "Emerging Application",
      "title": string,
      "description": string,
      "confidence": number (0.50 to 0.99),
      "signals": [string, string]
    }}
  ],
  "top_organizations": [
    {{
      "organization_name": string,
      "research_trend": "Increasing" | "Stable" | "Decreasing",
      "patent_trend": "Increasing" | "Stable" | "Decreasing",
      "applications": [string, string]
    }}
  ]
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        for model in GEMINI_MODELS:
            url = f"{API_BASE}/{model}:generateContent?key={key}"
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(text)
                        parsed["_model_used"] = model
                        parsed["_source"] = "Google Gemini AI"
                        logger.info("Successfully analyzed '%s' with %s", tech_name, model)
                        return parsed
                elif resp.status_code in (429, 503):
                    logger.warning("Gemini model %s busy (%s). Trying next...", model, resp.status_code)
                    continue
                else:
                    logger.warning("Gemini model %s returned status %s: %s", model, resp.status_code, resp.text[:200])
            except Exception as e:
                logger.warning("Gemini query failed for model %s: %s", model, e)
                continue

    return None
