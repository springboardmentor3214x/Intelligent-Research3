"""
Automated Test Suite for Research Discovery & Innovation Copilot
Validates end-to-end continuous conversational guidance, real literature grounding,
gap identification, candidate idea formulation, selection, and roadmap blueprint generation.
"""
import sys
import os
import requests

BASE_URL = "http://127.0.0.1:8000"
HEADERS = {"x-user-id": "test-researcher-eval-01"}

def run_copilot_tests():
    print("==================================================")
    print("INNOVATION FEATURE: COPILOT AUTOMATED TEST SUITE")
    print("==================================================")

    # 1. Create Session
    print("\n[Test 1] Creating Research Copilot Session (Stage 1)...")
    payload = {
        "topic": "Neuromorphic Edge Computing",
        "title": "Neuromorphic Edge Computing Exploration",
        "domain": "Artificial Intelligence",
        "user_level": "Beginner",
        "skills": ["Python", "Computer Architecture"],
        "resources": {"compute": "Single Workstation GPU", "time_months": 6}
    }
    res_session = requests.post(f"{BASE_URL}/api/copilot/sessions", json=payload, headers=HEADERS)
    assert res_session.status_code == 201, f"Failed to create session: {res_session.text}"
    session_data = res_session.json()
    session_id = session_data["id"]
    print(f"  [PASS] Session created with ID: {session_id}")
    print(f"  [PASS] Initial Stage: {session_data['current_stage']}, Topic: {session_data['topic']}")

    # 2. Verify Session List
    print("\n[Test 2] Listing User Sessions...")
    res_list = requests.get(f"{BASE_URL}/api/copilot/sessions", headers=HEADERS)
    assert res_list.status_code == 200
    sessions = res_list.json()
    assert any(s["id"] == session_id for s in sessions), "Created session must appear in list"
    print(f"  [PASS] User session list verified (Total: {len(sessions)})")

    # 3. Retrieve Session Details & Initial Messages
    print("\n[Test 3] Fetching Session Details & Message History...")
    res_detail = requests.get(f"{BASE_URL}/api/copilot/sessions/{session_id}", headers=HEADERS)
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert len(detail_data["messages"]) >= 2, "Expected welcome interaction in message history"
    print(f"  [PASS] Session details retrieved with {len(detail_data['messages'])} messages")

    # 4. Progress to Stage 2: Literature Deep Dive
    print("\n[Test 4] Chatting in Stage 2 (Real Literature Exploration)...")
    chat_payload_s2 = {
        "session_id": session_id,
        "message": "Find and explain the state-of-the-art research papers in neuromorphic computing.",
        "stage": 2
    }
    res_chat_s2 = requests.post(f"{BASE_URL}/api/copilot/chat", json=chat_payload_s2, headers=HEADERS)
    assert res_chat_s2.status_code == 200, f"Stage 2 chat failed: {res_chat_s2.text}"
    s2_data = res_chat_s2.json()
    assert s2_data["stage"] == 2
    assert "structured_data" in s2_data
    assert len(s2_data["follow_up_suggestions"]) > 0
    print(f"  [PASS] Stage 2 response received ({len(s2_data['message'])} chars)")
    print(f"  [PASS] Retrieved papers tracked in structured_data: {len(s2_data['structured_data'].get('papers', []))} papers")

    # 5. Progress to Stage 3: Evidence-Based Gap Matrix
    print("\n[Test 5] Chatting in Stage 3 (Comparative Gap Analysis)...")
    chat_payload_s3 = {
        "session_id": session_id,
        "message": "What are the core research gaps and limitations of these studies?",
        "stage": 3
    }
    res_chat_s3 = requests.post(f"{BASE_URL}/api/copilot/chat", json=chat_payload_s3, headers=HEADERS)
    assert res_chat_s3.status_code == 200
    s3_data = res_chat_s3.json()
    assert s3_data["stage"] == 3
    assert len(s3_data["structured_data"].get("gaps", [])) >= 2
    print(f"  [PASS] Stage 3 identified {len(s3_data['structured_data'].get('gaps', []))} verified research gaps")

    # 6. Progress to Stage 4: Formulate Candidate Ideas
    print("\n[Test 6] Formulating Candidate Research Ideas (Stage 4)...")
    chat_payload_s4 = {
        "session_id": session_id,
        "message": "Suggest suitable research project ideas targeting these gaps based on my skills.",
        "stage": 4
    }
    res_chat_s4 = requests.post(f"{BASE_URL}/api/copilot/chat", json=chat_payload_s4, headers=HEADERS)
    assert res_chat_s4.status_code == 200
    s4_data = res_chat_s4.json()
    assert s4_data["stage"] == 4
    candidate_ideas = s4_data["structured_data"].get("candidate_ideas", [])
    assert len(candidate_ideas) >= 2, "Expected multiple candidate ideas"
    selected_idea_id = candidate_ideas[0]["id"]
    print(f"  [PASS] Stage 4 generated {len(candidate_ideas)} ideas. Picked candidate: {selected_idea_id}")

    # 7. Progress to Stage 5: Select Idea & Formulate Blueprint
    print("\n[Test 7] Selecting Idea & Synthesizing Complete Research Plan (Stage 5)...")
    select_payload = {"idea_id": selected_idea_id}
    res_select = requests.post(f"{BASE_URL}/api/copilot/sessions/{session_id}/select-idea", json=select_payload, headers=HEADERS)
    assert res_select.status_code == 200, f"Idea selection failed: {res_select.text}"
    plan_data = res_select.json()
    assert plan_data["title"] is not None
    assert len(plan_data["objectives"]) >= 2
    assert len(plan_data["milestones"]) >= 3
    assert len(plan_data["evaluation_metrics"]) >= 2
    print(f"  [PASS] Blueprint synthesized: '{plan_data['title']}'")
    print(f"  [PASS] Objectives: {len(plan_data['objectives'])}, Milestones: {len(plan_data['milestones'])}, Datasets: {len(plan_data['datasets'])}")

    # 8. Export Session Data for Reports Module
    print("\n[Test 8] Exporting Session for Module 11 Reports & Export...")
    res_export = requests.get(f"{BASE_URL}/api/copilot/sessions/{session_id}/export", headers=HEADERS)
    assert res_export.status_code == 200
    export_json = res_export.json()
    assert "ideas" in export_json
    assert "plans" in export_json
    assert export_json["topic"] == "Neuromorphic Edge Computing"
    print(f"  [PASS] Session exported successfully with {len(export_json['ideas'])} ideas and {len(export_json['plans'])} plans")

    print("\n==================================================")
    print("ALL COPILOT FEATURE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_copilot_tests()
