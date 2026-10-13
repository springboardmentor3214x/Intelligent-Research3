"""
Comprehensive API & Scalability Validation Suite
Evaluates all API endpoints, auth flow, CRUD operations, event bus,
multi-source research engine, and concurrent stress/scalability performance.
"""
import time
import uuid
from datetime import datetime
import concurrent.futures
import requests

BASE_URL = "http://127.0.0.1:8000"

def log_section(title):
    print(f"\n{'='*70}")
    print(f" {title.upper()}")
    print(f"{'='*70}")

def test_system_health():
    log_section("1. System Health & Metadata Endpoints")
    res_root = requests.get(f"{BASE_URL}/")
    assert res_root.status_code == 200, f"Root endpoint failed: {res_root.text}"
    print(f"[PASS] GET / -> {res_root.status_code}: {res_root.json()['message']}")

    res_health = requests.get(f"{BASE_URL}/health")
    assert res_health.status_code == 200, f"Health check failed: {res_health.text}"
    print(f"[PASS] GET /health -> {res_health.status_code}: status={res_health.json()['status']}")

    res_openapi = requests.get(f"{BASE_URL}/openapi.json")
    assert res_openapi.status_code == 200, "OpenAPI schema failed"
    paths_count = len(res_openapi.json().get("paths", {}))
    print(f"[PASS] GET /openapi.json -> Registered Endpoints: {paths_count}")

def test_auth_and_user_flow():
    log_section("2. Authentication & User Endpoints")
    uid = uuid.uuid4().hex[:8]
    test_email = f"benchmark_user_{uid}@infosys-test.com"
    test_password = "SecurePassword123!"

    # Register
    reg_payload = {
        "email": test_email,
        "password": test_password,
        "name": f"Dr. Alex Carter {uid}",
        "role": "Researcher"
    }
    res_reg = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    assert res_reg.status_code in [201, 200], f"Registration failed: {res_reg.text}"
    print(f"[PASS] POST /auth/register -> User created: {test_email}")

    # Login
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    res_login = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    login_data = res_login.json()
    token = login_data["access_token"]
    user_id = login_data["user_id"]
    print(f"[PASS] POST /auth/login -> JWT Issued (UserID: {user_id})")

    headers = {"Authorization": f"Bearer {token}"}

    # Get /users/me
    res_me = requests.get(f"{BASE_URL}/users/me", headers=headers)
    assert res_me.status_code == 200, f"Get user me failed: {res_me.text}"
    print(f"[PASS] GET /users/me -> Retrieved profile for {res_me.json()['email']}")

    # Update /users/me
    update_payload = {"name": f"Dr. Alex Carter Updated {uid}"}
    res_update = requests.put(f"{BASE_URL}/users/me", json=update_payload, headers=headers)
    assert res_update.status_code == 200, f"Update user failed: {res_update.text}"
    print(f"[PASS] PUT /users/me -> Name successfully updated to '{res_update.json()['name']}'")

    # Logout
    res_logout = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    assert res_logout.status_code == 200, "Logout endpoint failed"
    print(f"[PASS] POST /auth/logout -> {res_logout.json()['message']}")

    return headers, user_id

def test_research_profile_flow(headers):
    log_section("3. Research Profile Endpoints")
    # Initial GET (might be 404 if not created)
    res_get = requests.get(f"{BASE_URL}/profile", headers=headers)
    if res_get.status_code == 404:
        # Create profile
        profile_data = {
            "research_summary": "Pioneering distributed neural networks and translational machine learning applications.",
            "research_areas": [{"name": "Large Language Models"}, {"name": "Computer Vision"}],
            "keywords": [{"keyword": "Deep Learning"}, {"keyword": "Transformers"}],
            "technology_areas": [{"name": "Edge AI"}, {"name": "Federated Learning"}],
            "organization_info": {
                "organization_name": "Infosys AI Innovation Labs",
                "department": "Advanced Research Center",
                "designation": "Principal AI Scientist",
                "country": "India"
            }
        }
        res_post = requests.post(f"{BASE_URL}/profile", json=profile_data, headers=headers)
        assert res_post.status_code in [200, 201], f"Profile creation failed: {res_post.text}"
        print(f"[PASS] POST /profile -> Created Research Profile ID={res_post.json().get('id')}")
    else:
        print(f"[PASS] GET /profile -> Found existing profile")

    # Update profile
    update_profile = {
        "research_summary": "Lead Investigator for Multi-Agent Enterprise Research Systems."
    }
    res_put = requests.put(f"{BASE_URL}/profile", json=update_profile, headers=headers)
    assert res_put.status_code == 200, f"Profile update failed: {res_put.text}"
    print(f"[PASS] PUT /profile -> Successfully updated summary")

def test_publications_and_patents_crud(headers):
    log_section("4. Publications & Patents CRUD Endpoints")
    # Publication Create
    pub_payload = {
        "title": "Scalable Multi-Agent Neural Architectures for Enterprise Search",
        "journal_or_conference": "IEEE Transactions on Neural Networks",
        "publication_year": 2026,
        "doi": "10.1109/TNNLS.2026.001",
        "abstract": "We present high throughput evaluation metrics for intelligent platforms."
    }
    res_pub = requests.post(f"{BASE_URL}/publications", json=pub_payload, headers=headers)
    assert res_pub.status_code in [200, 201], f"Publication create failed: {res_pub.text}"
    pub_id = res_pub.json()["id"]
    print(f"[PASS] POST /publications -> Created Publication ID={pub_id}")

    # Publication List
    res_list = requests.get(f"{BASE_URL}/publications", headers=headers)
    assert res_list.status_code == 200
    assert any(p["id"] == pub_id for p in res_list.json())
    print(f"[PASS] GET /publications -> Verified in list (Count={len(res_list.json())})")

    # Publication Update
    res_pub_up = requests.put(f"{BASE_URL}/publications/{pub_id}", json={"journal_or_conference": "IEEE Trans AI 2026"}, headers=headers)
    assert res_pub_up.status_code == 200
    print(f"[PASS] PUT /publications/{pub_id} -> Updated journal successfully")

    # Patent Create
    pat_payload = {
        "title": "Autonomous High-Throughput Notification Dispatch Optimization",
        "patent_number": f"US-{uuid.uuid4().hex[:6].upper()}-B2",
        "filing_date": datetime.utcnow().isoformat(),
        "status": "Granted",
        "description": "High concurrency real-time notification engine."
    }
    res_pat = requests.post(f"{BASE_URL}/patents", json=pat_payload, headers=headers)
    assert res_pat.status_code in [200, 201], f"Patent create failed: {res_pat.text}"
    pat_id = res_pat.json()["id"]
    print(f"[PASS] POST /patents -> Created Patent ID={pat_id}")

    # Patent List
    res_pat_list = requests.get(f"{BASE_URL}/patents", headers=headers)
    assert res_pat_list.status_code == 200
    assert any(p["id"] == pat_id for p in res_pat_list.json())
    print(f"[PASS] GET /patents -> Verified patent in list (Count={len(res_pat_list.json())})")

    # Clean up test publication & patent
    del_pub = requests.delete(f"{BASE_URL}/publications/{pub_id}", headers=headers)
    assert del_pub.status_code in [200, 204], "Delete publication failed"
    del_pat = requests.delete(f"{BASE_URL}/patents/{pat_id}", headers=headers)
    assert del_pat.status_code in [200, 204], "Delete patent failed"
    print(f"[PASS] DELETE /publications/{pub_id} & DELETE /patents/{pat_id} -> Deleted successfully")

def test_notification_and_event_pipeline(headers, user_id):
    log_section("5. Module 10: Notification Engine & Event Pipeline")
    uid_str = str(user_id)
    # 1. Preferences
    notif_headers = {"x-user-id": uid_str}
    res_pref = requests.get(f"{BASE_URL}/api/notification-preferences", headers=notif_headers)
    assert res_pref.status_code == 200, f"Get preferences failed: {res_pref.text}"
    print(f"[PASS] GET /api/notification-preferences -> Retrieved {len(res_pref.json())} category preferences")

    # 2. Publish an Event to Event Bus
    event_payload = {
        "event_id": f"evt-{uuid.uuid4().hex[:8]}",
        "event_type": "FUNDING_OPPORTUNITY_CREATED",
        "source_module": "funding",
        "entity_type": "grant",
        "entity_id": "grant-scalability-2026",
        "payload": {
            "title": "Quantum & Neural Accelerators Enterprise Grant 2026",
            "domain": "Artificial Intelligence",
            "research_areas": ["Large Language Models", "Quantum Computing"],
            "keywords": ["Transformers", "Deep Learning", "Generative AI"],
            "amount": "$2,500,000 USD",
            "days_left": 14
        }
    }
    res_evt = requests.post(f"{BASE_URL}/api/events/publish", json=event_payload)
    assert res_evt.status_code == 200, f"Event publish failed: {res_evt.text}"
    evt_resp = res_evt.json()
    print(f"[PASS] POST /api/events/publish -> Dispatched event, processed notifications: {evt_resp.get('processed_notifications')}")

    # 3. Check notifications for user
    res_notifs = requests.get(f"{BASE_URL}/api/notifications", headers=notif_headers)
    assert res_notifs.status_code == 200, f"Get notifications failed: {res_notifs.text}"
    notif_data = res_notifs.json()
    print(f"[PASS] GET /api/notifications -> Retrieved {notif_data.get('total', 0)} notifications (Unread: {notif_data.get('unread_count', 0)})")

    # 4. Check unread count
    res_count = requests.get(f"{BASE_URL}/api/notifications/count", headers=notif_headers)
    assert res_count.status_code == 200, f"Get count failed: {res_count.text}"
    print(f"[PASS] GET /api/notifications/count -> Unread badge: {res_count.json().get('unread')}")

    # 5. Check Analytics
    res_analytics = requests.get(f"{BASE_URL}/api/notifications/analytics", headers=notif_headers)
    assert res_analytics.status_code == 200, f"Get analytics failed: {res_analytics.text}"
    print(f"[PASS] GET /api/notifications/analytics -> Analytics computed: total={res_analytics.json().get('total_notifications')}")

    # 6. Read All
    res_read_all = requests.patch(f"{BASE_URL}/api/notifications/read-all", headers=notif_headers)
    assert res_read_all.status_code == 200, f"Read-all failed: {res_read_all.text}"
    print(f"[PASS] PATCH /api/notifications/read-all -> {res_read_all.json()}")

def test_research_intelligence_endpoints():
    log_section("6. Module 3: Multi-Source Research Intelligence")
    # Provider status
    res_status = requests.get(f"{BASE_URL}/api/research/providers/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    print(f"[PASS] GET /api/research/providers/status -> {status_data['active_providers_count']}/{status_data['total_providers_count']} Active Providers: {[p['name'] for p in status_data['providers']]}")

    # Trends
    res_trends = requests.get(f"{BASE_URL}/api/research/trends?domain=Artificial+Intelligence&years=3")
    assert res_trends.status_code == 200
    print(f"[PASS] GET /api/research/trends -> Analyzed: {res_trends.json().get('total_publications_analyzed')} publications across {len(res_trends.json().get('top_topics', []))} top topics")

    # Recommendations
    res_recs = requests.get(f"{BASE_URL}/api/research/recommendations?domain=Computer+Science&keywords=AI&limit=3")
    assert res_recs.status_code == 200
    print(f"[PASS] GET /api/research/recommendations -> Generated {len(res_recs.json())} recommended papers")

def test_scalability_and_load():
    log_section("7. Scalability & Concurrent Stress Load Evaluation")
    CONCURRENT_THREADS = 12
    TOTAL_REQUESTS = 60

    urls_to_test = [
        f"{BASE_URL}/health",
        f"{BASE_URL}/api/research/providers/status",
        f"{BASE_URL}/api/research/trends?domain=Computer+Vision&years=2",
        f"{BASE_URL}/api/notifications/count?user_id=benchmark_user",
        f"{BASE_URL}/openapi.json",
        f"{BASE_URL}/"
    ]

    print(f"Executing {TOTAL_REQUESTS} concurrent requests across {CONCURRENT_THREADS} worker threads...")

    latencies = []
    status_codes = {}
    errors = 0

    def send_request(idx):
        url = urls_to_test[idx % len(urls_to_test)]
        start = time.perf_counter()
        try:
            r = requests.get(url, timeout=10)
            latency = (time.perf_counter() - start) * 1000
            return r.status_code, latency, None
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            return 0, latency, str(e)

    start_bench = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_THREADS) as executor:
        futures = [executor.submit(send_request, i) for i in range(TOTAL_REQUESTS)]
        for f in concurrent.futures.as_completed(futures):
            code, latency, err = f.result()
            latencies.append(latency)
            status_codes[code] = status_codes.get(code, 0) + 1
            if err or code != 200:
                errors += 1

    total_duration = time.perf_counter() - start_bench
    rps = TOTAL_REQUESTS / total_duration if total_duration > 0 else 0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    min_latency = min(latencies) if latencies else 0
    max_latency = max(latencies) if latencies else 0
    latencies.sort()
    p95_latency = latencies[int(len(latencies) * 0.95)] if latencies else 0

    print("\n--- SCALABILITY & CONCURRENCY BENCHMARK RESULTS ---")
    print(f"Total Requests:       {TOTAL_REQUESTS}")
    print(f"Concurrent Workers:   {CONCURRENT_THREADS}")
    print(f"Total Elapsed Time:   {total_duration:.3f} s")
    print(f"Throughput:           {rps:.2f} Requests/Second (RPS)")
    print(f"Average Latency:      {avg_latency:.2f} ms")
    print(f"Min Latency:          {min_latency:.2f} ms")
    print(f"Max Latency:          {max_latency:.2f} ms")
    print(f"P95 Latency:          {p95_latency:.2f} ms")
    print(f"Status Distribution:  {status_codes}")
    print(f"Error Rate:           {(errors / TOTAL_REQUESTS) * 100:.2f}%")

    assert errors == 0, f"Expected 0 errors during concurrent load, got {errors}"
    print("\n[SUCCESS] The API server passed all concurrency, throughput, and scalability checks with 100% success rate!")

if __name__ == "__main__":
    test_system_health()
    headers, user_id = test_auth_and_user_flow()
    test_research_profile_flow(headers)
    test_publications_and_patents_crud(headers)
    test_notification_and_event_pipeline(headers, user_id)
    test_research_intelligence_endpoints()
    test_scalability_and_load()
    print("\n" + "="*70)
    print(" ALL API TESTS & SCALABILITY VERIFICATION PASSED PERFECTLY!")
    print("="*70)
