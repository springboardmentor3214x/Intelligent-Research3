"""
Gemini Intelligence Service
============================
Integrates Google Gemini Generative Language API with real-time model querying
to generate deep, real-time Technology Intelligence analysis for Module 6.

Model list verified live against the API (Sep 2026).
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Models verified USABLE with generateContent (tested Sep 2026).
GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-pro-latest",
]

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def get_gemini_api_key() -> str:
    cfg = get_settings()
    return cfg.GEMINI_API_KEY or cfg.GOOGLE_API_KEY or ""


async def analyze_technology_with_gemini(
    tech_name: str,
    domain_hint: str | None = None,
    empirical_stats: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    key = get_gemini_api_key()
    if not key:
        logger.warning("No Gemini API key configured.")
        return None

    stats_context = ""
    if empirical_stats:
        stats_context = f"\nEmpirical data from OpenAlex:\n{json.dumps(empirical_stats, indent=2)}\n"

    prompt = (
        f'You are a Technology Intelligence AI. Analyze: "{tech_name}".\n'
        + (f"Domain: {domain_hint}\n" if domain_hint else "")
        + stats_context
        + """Return ONLY valid JSON (no markdown) with this exact schema:
{
  "domain": string,
  "description": string,
  "keywords": [string],
  "related_technologies": [string],
  "stage": "Emerging"|"Developing"|"Mature"|"Declining",
  "score": number 10-95,
  "summary": string,
  "signals": [string, string, string],
  "indicators": {
    "researchGrowth": number 0-100,
    "patentGrowth": number 0-100,
    "researchActivity": number 0-100,
    "patentActivity": number 0-100,
    "organizationParticipation": number 0-100,
    "applicationDiversity": number 0-100
  },
  "adoption": {"level": "Low"|"Medium"|"High", "trend": "Increasing"|"Stable"|"Decreasing"},
  "opportunities": [{"opportunity_type": string, "title": string, "description": string, "confidence": number, "signals": [string]}],
  "top_organizations": [{"organization_name": string, "research_trend": string, "patent_trend": string, "applications": [string]}]
}"""
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in GEMINI_MODELS:
            url = f"{API_BASE}/{model}:generateContent?key={key}"
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(text)
                        parsed["_model_used"] = model
                        parsed["_source"] = "Google Gemini AI"
                        logger.info("Analyzed '%s' with %s", tech_name, model)
                        return parsed
                elif resp.status_code in (404, 429, 503):
                    logger.warning("Model %s unavailable (%s), trying next.", model, resp.status_code)
                    continue
                else:
                    logger.warning("Model %s: status %s — %s", model, resp.status_code, resp.text[:200])
            except Exception as exc:
                logger.warning("Model %s failed: %s", model, exc)
                continue

    logger.error("All Gemini models failed for '%s'", tech_name)
    return None
