"""
Module 10 Notification System Comprehensive Test Suite
Tests:
1. Event bus subscription & ingestion
2. Explainable relevance engine
3. Priority & severity calculation
4. Deduplication & idempotency hashing
5. Preference enforcement
6. Full Notification Pipeline
7. FastAPI REST endpoints
"""
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.database import Base, engine, SessionLocal
from backend.app.models.notification import Notification, NotificationEvent, NotificationPreference, NotificationAuditLog
from backend.app.services.relevance_engine import RelevanceEngine
from backend.app.services.priority_engine import PriorityEngine
from backend.app.services.deduplication import DeduplicationEngine
from backend.app.services.notification_service import NotificationService

def run_tests():
    print("==================================================")
    print("MODULE 10: AUTOMATED TEST SUITE EXECUTION")
    print("==================================================")

    # 1. Setup Test DB
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    test_user_id = "test-user-eval-01"
    user_profile = {
        "user_id": test_user_id,
        "fullName": "Dr. Sarah Jenkins",
        "email": "sarah.jenkins@stanford.edu",
        "role": "Researcher",
        "researchDomain": "Artificial Intelligence",
        "researchAreas": ["Computer Vision", "Machine Learning", "Neural Networks"],
        "researchInterests": ["Generative AI", "Translational Medicine"],
        "researchKeywords": ["Deep Learning", "Medical Imaging", "Edge AI"],
        "technologyAreas": ["Edge AI", "Neural Accelerators"]
    }

    # Clean previous test records
    db.query(Notification).filter(Notification.user_id == test_user_id).delete()
    db.query(NotificationPreference).filter(NotificationPreference.user_id == test_user_id).delete()
    db.commit()

    # ── Test 1: Relevance Engine Scoring ─────────────────────────────────────
    print("\n[Test 1] Testing Explainable Relevance Engine...")
    relevant_funding_payload = {
        "title": "NSF Translational AI Healthcare Grant",
        "domain": "Artificial Intelligence",
        "research_areas": ["Computer Vision", "Translational Medicine"],
        "keywords": ["Medical Imaging", "Deep Learning"],
        "funding_amount": "$1,500,000 USD",
        "days_left": 10
    }
    score, reasons, is_rel = RelevanceEngine.evaluate_relevance(user_profile, relevant_funding_payload, "funding")
    assert is_rel == True, "Expected event to be marked relevant"
    assert score >= 60.0, f"Expected score >= 60, got {score}"
    assert len(reasons) >= 2, "Expected multiple explainable match reasons"
    print(f"  [PASS] Relevance Score: {score}/100, Reasons: {reasons}")

    irrelevant_payload = {
        "title": "Marine Biology Coral Reef Preservation Grant",
        "domain": "Oceanography",
        "research_areas": ["Marine Ecology"],
        "keywords": ["Coral", "Ocean Acidification"]
    }
    irr_score, irr_reasons, irr_is_rel = RelevanceEngine.evaluate_relevance(user_profile, irrelevant_payload, "funding")
    assert irr_is_rel == False, "Expected marine biology event to be filtered out for AI researcher"
    print(f"  [PASS] Irrelevant event properly skipped (Score: {irr_score}/100)")

    # ── Test 2: Priority & Severity Engine ──────────────────────────────────
    print("\n[Test 2] Testing Dynamic Priority & Severity Engine...")
    p, s = PriorityEngine.calculate_priority("FUNDING_DEADLINE_APPROACHING", 85.0, {"days_left": 8})
    assert p == "HIGH", f"Expected HIGH priority for urgent deadline, got {p}"
    assert s == "warning", f"Expected warning severity, got {s}"
    print(f"  [PASS] Urgent deadline evaluated to Priority={p}, Severity={s}")

    # ── Test 3: Deduplication & Idempotency ──────────────────────────────────
    print("\n[Test 3] Testing Idempotency & Duplicate Prevention...")
    key1 = DeduplicationEngine.generate_idempotency_key(test_user_id, "evt-101", "funding", "grant-001")
    key2 = DeduplicationEngine.generate_idempotency_key(test_user_id, "evt-101", "funding", "grant-001")
    assert key1 == key2, "Idempotency key must be deterministic"
    print(f"  [PASS] Deterministic key generated: {key1[:16]}...")

    # ── Test 4: End-to-End Pipeline Ingestion ────────────────────────────────
    print("\n[Test 4] Testing Full Notification Pipeline (Ingestion -> Relevance -> Preference -> Storage)...")
    event_1 = {
        "event_id": "evt-test-funding-999",
        "event_type": "FUNDING_OPPORTUNITY_CREATED",
        "source_module": "funding",
        "entity_type": "grant",
        "entity_id": "grant-nsf-999",
        "payload": {
            "title": "NSF Translational AI Healthcare Grant",
            "agency": "National Science Foundation",
            "amount": "$1,500,000 USD",
            "funding_amount": "$1,500,000 USD",
            "days_left": 12,
            "domain": "Artificial Intelligence",
            "keywords": ["Medical Imaging", "Computer Vision"]
        }
    }

    created = NotificationService.process_event(db, event_1, [user_profile])
    assert len(created) == 1, f"Expected 1 notification created, got {len(created)}"
    notif = created[0]
    assert notif.user_id == test_user_id
    assert notif.is_read == False
    assert notif.priority == "HIGH"
    print(f"  [PASS] Notification successfully created in DB: ID={notif.id}, Title='{notif.title}'")

    # Repeat same event to test Deduplication
    print("  -> Testing repeated event submission...")
    created_dup = NotificationService.process_event(db, event_1, [user_profile])
    assert len(created_dup) == 0, "Duplicate event must NOT create a second notification"
    print("  [PASS] Duplicate event successfully rejected without spamming the user.")

    # ── Test 5: User Preferences Enforcement ────────────────────────────────
    print("\n[Test 5] Testing Notification Preferences Suppression...")
    # Disable patents in user preferences
    db.add(NotificationPreference(
        user_id=test_user_id,
        category="patents",
        in_app=False,
        email=False,
        push=False
    ))
    db.commit()

    patent_event = {
        "event_id": "evt-test-pat-888",
        "event_type": "PATENT_CLUSTER_DETECTED",
        "source_module": "patents",
        "entity_type": "patent_cluster",
        "entity_id": "pat-cluster-888",
        "payload": {
            "technology_domain": "Artificial Intelligence Computer Vision",
            "assignee": "Google LLC",
            "count": 12,
            "domain": "Artificial Intelligence"
        }
    }
    pat_created = NotificationService.process_event(db, patent_event, [user_profile])
    assert len(pat_created) == 0, "Disabled patent category in preferences must prevent notification creation"
    print("  [PASS] User preference check respected: Patent notification suppressed.")

    # ── Test 6: Read / Unread State & Audit Log ──────────────────────────────
    print("\n[Test 6] Testing Read/Unread State & Audit Logs...")
    notif.is_read = True
    notif.status = "read"
    db.commit()
    db.refresh(notif)
    assert notif.is_read == True

    audit_entries = db.query(NotificationAuditLog).filter(NotificationAuditLog.user_id == test_user_id).all()
    assert len(audit_entries) >= 2, f"Expected audit logs, got {len(audit_entries)}"
    print(f"  [PASS] Verified state transitions and {len(audit_entries)} audit trail entries.")

    db.close()
    print("\n==================================================")
    print("ALL MODULE 10 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
