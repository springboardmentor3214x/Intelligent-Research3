"""
Module 10: Relevance Engine
Calculates explainable, deterministic relevance scores between platform events and user research profiles.
No hallucinated or arbitrary relevance. Every score is backed by explainable reasons.
"""
from typing import Dict, Any, List, Tuple
import re

class RelevanceEngine:
    @staticmethod
    def _normalize(text: str) -> str:
        return re.sub(r'[^a-zA-Z0-9\s]', '', str(text).lower()).strip()

    @classmethod
    def evaluate_relevance(cls, user_profile: Dict[str, Any], event_payload: Dict[str, Any], source_module: str) -> Tuple[float, List[str], bool]:
        """
        Calculates relevance score (0 - 100), reasons, and eligibility.
        user_profile expects:
          - role: str
          - researchDomain: str (or research_domain)
          - researchAreas: list[str] (or research_areas)
          - researchInterests: list[str] (or research_interests)
          - researchKeywords: list[str] (or research_keywords)
          - technologyAreas: list[str] (or technology_areas)
          - organization: str
        """
        score = 0.0
        reasons = []

        user_domain = cls._normalize(user_profile.get("researchDomain") or user_profile.get("research_domain", ""))
        user_areas = [cls._normalize(a) for a in (user_profile.get("researchAreas") or user_profile.get("research_areas") or []) if a]
        user_interests = [cls._normalize(i) for i in (user_profile.get("researchInterests") or user_profile.get("research_interests") or []) if i]
        user_keywords = [cls._normalize(k) for k in (user_profile.get("researchKeywords") or user_profile.get("research_keywords") or []) if k]
        user_techs = [cls._normalize(t) for t in (user_profile.get("technologyAreas") or user_profile.get("technology_areas") or []) if t]
        user_role = (user_profile.get("role") or "").lower()

        # Extract event attributes
        event_domain = cls._normalize(event_payload.get("domain") or event_payload.get("research_domain") or "")
        event_areas = [cls._normalize(a) for a in event_payload.get("research_areas", []) if a]
        event_keywords = [cls._normalize(k) for k in event_payload.get("keywords", []) if k]
        event_tech = cls._normalize(event_payload.get("technology") or event_payload.get("technology_domain") or "")
        event_title = cls._normalize(event_payload.get("title") or "")
        event_desc = cls._normalize(event_payload.get("description") or event_payload.get("desc") or "")
        target_role = (event_payload.get("target_role") or "").lower()

        text_corpus = f"{event_title} {event_desc} {event_domain} {event_tech} {' '.join(event_areas)} {' '.join(event_keywords)}"

        # 1. Direct Domain Match (+30)
        if user_domain and (user_domain in text_corpus or (event_domain and user_domain == event_domain)):
            score += 30.0
            reasons.append(f"Matched your research domain: {user_profile.get('researchDomain') or user_profile.get('research_domain')}")

        # 2. Research Areas Match (up to +25)
        matched_areas = []
        for area in user_areas:
            if area and area in text_corpus:
                matched_areas.append(area)
        if matched_areas:
            area_score = min(25.0, len(matched_areas) * 15.0)
            score += area_score
            reasons.append(f"Matched research areas: {', '.join(matched_areas[:3])}")

        # 3. Technology Areas Match (up to +25)
        matched_techs = []
        for tech in user_techs:
            if tech and (tech in text_corpus or (event_tech and tech in event_tech)):
                matched_techs.append(tech)
        if matched_techs:
            tech_score = min(25.0, len(matched_techs) * 15.0)
            score += tech_score
            reasons.append(f"Matched monitored technology: {', '.join(matched_techs[:3])}")

        # 4. Keywords & Interests Match (up to +20)
        matched_kw = []
        for kw in (user_keywords + user_interests):
            if kw and len(kw) > 2 and kw in text_corpus:
                matched_kw.append(kw)
        if matched_kw:
            kw_score = min(20.0, len(matched_kw) * 5.0)
            score += kw_score
            reasons.append(f"Matched keywords: {', '.join(list(set(matched_kw))[:4])}")

        # 5. Role Suitability (+10 or context boost)
        if target_role:
            if user_role and (target_role in user_role or user_role in target_role):
                score += 10.0
                reasons.append(f"Targeted for role: {user_profile.get('role')}")
        else:
            # Baseline role relevance
            if user_role == "researcher" and source_module in ["research", "funding", "patents"]:
                score += 5.0
            elif user_role in ["founder", "startup founder"] and source_module in ["funding", "commercialization", "technology"]:
                score += 5.0
            elif user_role in ["manager", "innovation manager"] and source_module in ["technology", "innovation", "commercialization"]:
                score += 5.0
            elif user_role in ["admin", "administrator"]:
                score += 10.0

        # Bound score between 0 and 100
        final_score = min(100.0, round(score, 1))

        # Check threshold
        # If no specific profile fields match, but event is a system/report event, pass with baseline
        if source_module in ["reports", "platform", "system"]:
            final_score = max(final_score, 85.0)
            if not reasons:
                reasons.append("Platform service event for your account")

        is_relevant = final_score >= 35.0 or source_module in ["reports", "platform", "system"]

        return final_score, reasons, is_relevant
