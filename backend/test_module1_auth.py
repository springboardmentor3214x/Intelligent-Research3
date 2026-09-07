import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.getcode()
            res_body = resp.read().decode("utf-8")
            return status_code, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(res_body)
        except Exception:
            parsed = res_body
        return e.code, parsed

def run_tests():
    print("=== STARTING MODULE 1 VERIFICATION SUITE ===")
    
    # 1. Health check
    status, body = request("GET", "/")
    print(f"[1] Root Health Check: {status} -> {body}")
    assert status == 200, "Root health check failed"

    # 2. Valid Registration
    test_email = f"test_researcher_01@platform.org"
    reg_payload = {
        "name": "Dr. Sarah Connor",
        "email": test_email,
        "password": "Password123!",
        "role": "Researcher",
        "phone_number": "+1 555-0199",
        "organization": "Cybernetics AI Lab",
        "designation": "Lead Scientist",
        "country": "United States",
        "research_domain": "Autonomous AI Systems"
    }
    status, body = request("POST", "/auth/register", reg_payload)
    print(f"[2] User Registration: {status} -> {body}")
    assert status in (201, 409), f"Unexpected status {status}"

    # 3. Duplicate Registration (Should reject with 409)
    status, body = request("POST", "/auth/register", reg_payload)
    print(f"[3] Duplicate Registration Rejection: {status} -> {body}")
    assert status == 409, f"Expected 409 Conflict, got {status}"

    # 4. Weak password rejection
    weak_payload = reg_payload.copy()
    weak_payload["email"] = "weak@test.org"
    weak_payload["password"] = "123"
    status, body = request("POST", "/auth/register", weak_payload)
    print(f"[4] Weak Password Rejection: {status} -> {body}")
    assert status == 422, f"Expected 422 Unprocessable, got {status}"

    # 5. Invalid email rejection
    invalid_email_payload = reg_payload.copy()
    invalid_email_payload["email"] = "notanemail"
    status, body = request("POST", "/auth/register", invalid_email_payload)
    print(f"[5] Invalid Email Rejection: {status} -> {body}")
    assert status == 422, f"Expected 422 Unprocessable, got {status}"

    # 6. Valid Login
    login_payload = {"email": test_email, "password": "Password123!"}
    status, body = request("POST", "/auth/login", login_payload)
    print(f"[6] User Login: {status} -> Token Received: {bool(body.get('access_token'))}")
    assert status == 200 and "access_token" in body, "Login failed"
    token = body["access_token"]

    # 7. Invalid password login
    bad_login = {"email": test_email, "password": "WrongPassword123!"}
    status, body = request("POST", "/auth/login", bad_login)
    print(f"[7] Bad Password Login Rejection: {status} -> {body}")
    assert status == 401, f"Expected 401 Unauthorized, got {status}"

    # 8. Non-existent user login
    ghost_login = {"email": "ghost_nonexistent@test.org", "password": "Password123!"}
    status, body = request("POST", "/auth/login", ghost_login)
    print(f"[8] Non-existent User Login Rejection: {status} -> {body}")
    assert status == 401, f"Expected 401 Unauthorized, got {status}"

    # 9. Get User Profile with Valid JWT (/users/me)
    status, body = request("GET", "/users/me", token=token)
    print(f"[9] GET /users/me: {status} -> User: {body.get('name')} | Role: {body.get('role')}")
    assert status == 200, f"Expected 200, got {status}"

    # 10. Update User Profile with Valid JWT (/users/me)
    update_payload = {
        "name": "Dr. Sarah Connor, Ph.D.",
        "organization": "Cybernetics Institute of Technology",
        "designation": "Chief AI Scientist",
        "country": "United States",
        "research_domain": "Quantum AI & Safety"
    }
    status, body = request("PUT", "/users/me", data=update_payload, token=token)
    print(f"[10] PUT /users/me: {status} -> Updated Name: {body.get('name')} | Org: {body.get('organization')}")
    assert status == 200 and body.get("name") == "Dr. Sarah Connor, Ph.D.", "Profile update failed"

    # 11. Missing Token on Protected Route
    status, body = request("GET", "/users/me")
    print(f"[11] Protected Route without Token: {status} -> {body}")
    assert status == 401, f"Expected 401, got {status}"

    # 12. Invalid Token on Protected Route
    status, body = request("GET", "/users/me", token="invalid.fake.jwt.token")
    print(f"[12] Protected Route with Invalid Token: {status} -> {body}")
    assert status == 401, f"Expected 401, got {status}"

    # 13. Logout Endpoint
    status, body = request("POST", "/auth/logout")
    print(f"[13] POST /auth/logout: {status} -> {body}")
    assert status == 200, f"Expected 200, got {status}"

    print("=== ALL MODULE 1 TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
