import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
import models
from main import app

from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite database for automated testing with shared StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_user_registration_success():
    payload = {
        "full_name": "Dr. Alan Turing",
        "email": "alan.turing@university.edu",
        "password": "SecurePassword123!",
        "role": "Researcher"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "User registered successfully."
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "alan.turing@university.edu"
    assert data["data"]["user"]["role"] == "Researcher"
    assert "hashed_password" not in data["data"]["user"]

def test_duplicate_registration_returns_409():
    payload = {
        "full_name": "Jane Doe",
        "email": "jane@startup.com",
        "password": "Password123",
        "role": "Startup Founder"
    }
    # First registration
    client.post("/api/auth/register", json=payload)
    # Second registration with same email
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert "already exists" in data["message"]

def test_invalid_email_returns_422_validation_error():
    payload = {
        "full_name": "Test User",
        "email": "invalid-email-format",
        "password": "Password123",
        "role": "Researcher"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Input validation failed."

def test_short_password_returns_422():
    payload = {
        "full_name": "Test User",
        "email": "test@domain.com",
        "password": "123",
        "role": "Researcher"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422

def test_user_login_success():
    # Register user
    reg_payload = {
        "full_name": "Maria Curie",
        "email": "maria@lab.org",
        "password": "RadioactivePassword!456",
        "role": "Innovation Manager"
    }
    client.post("/api/auth/register", json=reg_payload)

    # Login user
    login_payload = {
        "email": "maria@lab.org",
        "password": "RadioactivePassword!456"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "maria@lab.org"

def test_login_invalid_password_returns_401():
    reg_payload = {
        "full_name": "Maria Curie",
        "email": "maria2@lab.org",
        "password": "CorrectPassword123",
        "role": "Researcher"
    }
    client.post("/api/auth/register", json=reg_payload)

    login_payload = {
        "email": "maria2@lab.org",
        "password": "WrongPassword999"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Invalid email or password."

def test_get_current_user_profile():
    reg_payload = {
        "full_name": "Admin User",
        "email": "admin@platform.com",
        "password": "AdminSecretPassword!789",
        "role": "Administrator"
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    token = reg_resp.json()["data"]["access_token"]

    profile_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert profile_resp.status_code == 200
    data = profile_resp.json()
    assert data["success"] is True
    assert data["data"]["email"] == "admin@platform.com"
    assert data["data"]["role"] == "Administrator"
