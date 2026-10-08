"""
Module 10: Priority & Severity Engine
Computes appropriate priority (LOW, MEDIUM, HIGH, CRITICAL) and severity (info, warning, success, error)
based on event characteristics, relevance score, approaching deadlines, and role impact.
"""

class PriorityEngine:
    PRIORITY_WEIGHTS = {
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "CRITICAL": 4
    }

    @staticmethod
    def calculate_priority(event_type: str, relevance_score: float, payload: dict) -> tuple[str, str]:
        """
        Returns (priority, severity)
        """
        event_type = event_type.upper()
        
        # 1. Critical System / Security Events
        if "SECURITY" in event_type or "CRITICAL" in event_type or "SYSTEM_OUTAGE" in event_type:
            return "CRITICAL", "error"

        # 2. Urgent Funding Deadlines (<= 14 days) or High Award Match
        if "FUNDING" in event_type:
            days_left = payload.get("days_left") or payload.get("deadline_days")
            if days_left is not None and int(days_left) <= 14:
                return "HIGH", "warning"
            if relevance_score >= 85.0:
                return "HIGH", "info"
            return "MEDIUM", "info"

        # 3. Key Patent Activity or Infringement/Cluster
        if "PATENT" in event_type:
            if payload.get("is_cluster") or relevance_score >= 88.0:
                return "HIGH", "info"
            return "MEDIUM", "info"

        # 4. Emerging Tech Breakthrough or Stage Transition
        if "TECHNOLOGY" in event_type:
            if payload.get("maturity_transition") or payload.get("is_breakthrough"):
                return "HIGH", "success"
            return "MEDIUM", "info"

        # 5. High-Impact Research Trend
        if "RESEARCH" in event_type:
            if payload.get("growth_rate_pct", 0) > 100 or payload.get("citation_velocity", 0) > 50:
                return "HIGH", "info"
            return "LOW" if relevance_score < 60 else "MEDIUM", "info"

        # 6. Commercialization Opportunities
        if "COMMERCIALIZATION" in event_type:
            if payload.get("opportunity_type") in ["licensing", "startup", "productization"] and relevance_score >= 80:
                return "HIGH", "success"
            return "MEDIUM", "info"

        # 7. Report Notifications
        if "REPORT" in event_type:
            if "FAILED" in event_type:
                return "HIGH", "error"
            return "MEDIUM", "success"

        # 8. Platform Updates
        if "PROFILE" in event_type:
            return "LOW", "info"

        return "LOW" if relevance_score < 50 else "MEDIUM", "info"

    @classmethod
    def meets_priority_threshold(cls, priority: str, min_priority: str) -> bool:
        """
        Checks if the notification priority is equal or higher than the minimum threshold
        """
        p_val = cls.PRIORITY_WEIGHTS.get(priority.upper(), 2)
        min_val = cls.PRIORITY_WEIGHTS.get(min_priority.upper(), 1)
        return p_val >= min_val
