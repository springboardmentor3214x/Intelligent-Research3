"""
Module 10: Notification Core Service
Orchestrates the entire Notification Pipeline:
Events -> Ingestion -> Relevance Engine -> Preferences -> Priority -> Deduplication -> Persistence -> Delivery -> Audit
"""
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid

from ..models.notification import (
    Notification, NotificationEvent, NotificationPreference, 
    NotificationDelivery, NotificationAuditLog
)
from .relevance_engine import RelevanceEngine
from .priority_engine import PriorityEngine
from .deduplication import DeduplicationEngine
from .delivery_manager import DeliveryManager

# Reusable Enterprise Notification Templates
NOTIFICATION_TEMPLATES = {
    "FUNDING_OPPORTUNITY_CREATED": {
        "category": "funding",
        "type": "funding",
        "title_template": "New Funding Opportunity: {title}",
        "message_template": "A new grant '{title}' by {agency} with award {amount} matching your research profile is available.",
        "action_path": "/funding"
    },
    "FUNDING_DEADLINE_APPROACHING": {
        "category": "funding",
        "type": "funding",
        "title_template": "Funding Deadline Approaching: {title}",
        "message_template": "Grant opportunity '{title}' closes in {days_left} days. Your profile eligibility match is {match}%.",
        "action_path": "/funding"
    },
    "PATENT_CREATED": {
        "category": "patents",
        "type": "patents",
        "title_template": "New Patent Filing: {title}",
        "message_template": "Patent '{title}' filed by {assignee} in {technology_domain} overlaps with your monitored focus area.",
        "action_path": "/patents"
    },
    "PATENT_CLUSTER_DETECTED": {
        "category": "patents",
        "type": "patents",
        "title_template": "Patent Cluster Detected in {technology_domain}",
        "message_template": "Detected high-velocity patent clustering ({count} filings) around {technology_domain} by {assignee}.",
        "action_path": "/patents"
    },
    "TECHNOLOGY_EMERGING": {
        "category": "technology",
        "type": "technology",
        "title_template": "Emerging Technology Signal: {technology}",
        "message_template": "Technology activity in {technology} has spiked based on multi-source patent and research publication signals.",
        "action_path": "/technology"
    },
    "TECHNOLOGY_MATURITY_CHANGED": {
        "category": "technology",
        "type": "technology",
        "title_template": "Technology Maturity Shift: {technology}",
        "message_template": "{technology} transitioned from {old_stage} to {new_stage} with opportunity score {score}/100.",
        "action_path": "/technology"
    },
    "RESEARCH_TREND_CHANGED": {
        "category": "research",
        "type": "research",
        "title_template": "Research Hotspot Growth: {topic}",
        "message_template": "Research topic '{topic}' demonstrated {growth} publication growth in the recent analysis window.",
        "action_path": "/research"
    },
    "COMMERCIALIZATION_OPPORTUNITY_FOUND": {
        "category": "commercialization",
        "type": "commercialization",
        "title_template": "Potential Commercialization Opportunity: {technology}",
        "message_template": "Identified potential {opportunity_type} pathway for '{technology}' supported by patent and market feasibility signals.",
        "action_path": "/commercialization"
    },
    "REPORT_GENERATED": {
        "category": "reports",
        "type": "reports",
        "title_template": "Intelligence Report Ready: {report_name}",
        "message_template": "Your '{report_name}' ({report_type}) has been compiled and is ready for interactive preview and export.",
        "action_path": "/reports"
    },
    "REPORT_FAILED": {
        "category": "reports",
        "type": "reports",
        "title_template": "Report Generation Failed",
        "message_template": "Unable to complete compilation for '{report_name}'. Error: {error_message}",
        "action_path": "/reports"
    },
    "PLATFORM_UPDATE": {
        "category": "platform",
        "type": "platform",
        "title_template": "Platform System Notice: {title}",
        "message_template": "{message}",
        "action_path": "/dashboard"
    }
}

class NotificationService:
    @staticmethod
    def process_event(db: Session, event_data: Dict[str, Any], candidate_users: List[Dict[str, Any]]) -> List[Notification]:
        event_id = event_data.get("event_id") or str(uuid.uuid4())
        event_type = event_data.get("event_type", "PLATFORM_UPDATE")
        source_module = event_data.get("source_module", "system")
        payload = event_data.get("payload", {})
        entity_id = str(event_data.get("entity_id", ""))

        # 1. Record event in database for full auditability (Idempotent)
        existing_event = db.query(NotificationEvent).filter(NotificationEvent.event_id == event_id).first()
        if not existing_event:
            event_record = NotificationEvent(
                event_id=event_id,
                event_type=event_type,
                source_module=source_module,
                entity_type=event_data.get("entity_type", "generic"),
                entity_id=entity_id,
                event_version=event_data.get("event_version", "1.0"),
                payload=payload,
                correlation_id=event_data.get("correlation_id")
            )
            db.add(event_record)
            db.commit()

        template = NOTIFICATION_TEMPLATES.get(event_type, {
            "category": "platform",
            "type": "platform",
            "title_template": payload.get("title", "Platform Alert"),
            "message_template": payload.get("message", "New platform activity."),
            "action_path": "/dashboard"
        })

        created_notifications = []

        for user_profile in candidate_users:
            user_id = str(user_profile.get("user_id") or user_profile.get("id") or "")
            if not user_id:
                continue

            # 2. Relevance Evaluation
            relevance_score, reasons, is_relevant = RelevanceEngine.evaluate_relevance(
                user_profile=user_profile,
                event_payload=payload,
                source_module=source_module
            )

            if not is_relevant and source_module not in ["reports", "platform", "system"]:
                db.add(NotificationAuditLog(
                    event_id=event_id,
                    user_id=user_id,
                    action="NOTIFICATION_SKIPPED",
                    result="SKIPPED_RELEVANCE",
                    details={"score": relevance_score, "reasons": reasons}
                ))
                continue

            # 3. Preference Check
            user_pref = db.query(NotificationPreference).filter(
                NotificationPreference.user_id == user_id,
                NotificationPreference.category == template["category"]
            ).first()

            if user_pref and not user_pref.in_app:
                db.add(NotificationAuditLog(
                    event_id=event_id,
                    user_id=user_id,
                    action="NOTIFICATION_SKIPPED",
                    result="SKIPPED_PREFERENCE",
                    details={"category": template["category"]}
                ))
                continue

            # 4. Priority & Severity Calculation
            priority, severity = PriorityEngine.calculate_priority(event_type, relevance_score, payload)

            min_priority = user_pref.min_priority if user_pref else "LOW"
            if not PriorityEngine.meets_priority_threshold(priority, min_priority):
                db.add(NotificationAuditLog(
                    event_id=event_id,
                    user_id=user_id,
                    action="NOTIFICATION_SKIPPED",
                    result="SKIPPED_PRIORITY_FILTER",
                    details={"priority": priority, "min_priority": min_priority}
                ))
                continue

            # 5. Deduplication & Idempotency Check
            idempotency_key = DeduplicationEngine.generate_idempotency_key(
                user_id=user_id,
                source_event_id=event_id,
                notification_type=template["type"],
                related_record_id=entity_id
            )

            existing_notif = db.query(Notification).filter(
                Notification.idempotency_key == idempotency_key
            ).first()

            if existing_notif:
                db.add(NotificationAuditLog(
                    event_id=event_id,
                    user_id=user_id,
                    action="NOTIFICATION_SKIPPED",
                    result="SKIPPED_DUPLICATE",
                    details={"idempotency_key": idempotency_key}
                ))
                continue

            try:
                title_rendered = template["title_template"].format(**payload)
            except Exception:
                title_rendered = payload.get("title", "Platform Notification")

            try:
                msg_rendered = template["message_template"].format(**payload)
            except Exception:
                msg_rendered = payload.get("message") or payload.get("desc") or "A new intelligence event was detected."

            # 6. Notification Creation & Persistence
            notification = Notification(
                id=str(uuid.uuid4()),
                user_id=user_id,
                type=template["type"],
                category=template["category"],
                title=title_rendered,
                message=msg_rendered,
                priority=priority,
                severity=severity,
                status="unread",
                is_read=False,
                related_module=source_module,
                related_record_id=entity_id,
                action_url=payload.get("action_url") or template.get("action_path", "/dashboard"),
                source_event_id=event_id,
                relevance_score=relevance_score,
                relevance_reason="; ".join(reasons) if reasons else "Direct platform alert",
                metadata_json=payload,
                idempotency_key=idempotency_key
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)

            # 7. Delivery Execution & Tracking
            in_app_delivery = DeliveryManager.deliver("in_app", user_id, {"id": notification.id})
            delivery_record = NotificationDelivery(
                notification_id=notification.id,
                channel="in_app",
                status=in_app_delivery["status"],
                delivered_at=in_app_delivery["delivered_at"],
                failure_reason=in_app_delivery.get("failure_reason")
            )
            db.add(delivery_record)

            if user_pref and user_pref.email:
                email_delivery = DeliveryManager.deliver("email", user_id, {"id": notification.id}, email_address=user_profile.get("email"))
                db.add(NotificationDelivery(
                    notification_id=notification.id,
                    channel="email",
                    status=email_delivery["status"],
                    delivered_at=email_delivery["delivered_at"],
                    failure_reason=email_delivery.get("failure_reason")
                ))

            # Audit Success
            db.add(NotificationAuditLog(
                event_id=event_id,
                user_id=user_id,
                action="NOTIFICATION_CREATED",
                result="SUCCESS",
                details={"notification_id": notification.id, "priority": priority, "score": relevance_score}
            ))

            db.commit()
            created_notifications.append(notification)

        return created_notifications
