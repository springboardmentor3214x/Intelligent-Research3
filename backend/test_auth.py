import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import funding, profile, research_paper, user  # noqa: F401

# Setup in-memory SQLite database for automated testing with shared StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_user_registration_success():
    payload = {
        "name": "Dr. Alan Turing",
        "email": "alan.turing@university.edu",
        "password": "SecurePassword123!",
        "role": "Researcher",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alan.turing@university.edu"
    assert data["role"] == "Researcher"


def test_duplicate_registration_returns_409():
    payload = {
        "name": "Jane Doe",
        "email": "jane@startup.com",
        "password": "Password123!",
        "role": "Startup Founder",
    }
    # First registration
    client.post("/api/auth/register", json=payload)
    # Second registration with same email
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 409


def test_invalid_email_returns_422_validation_error():
    payload = {
        "name": "Test User",
        "email": "invalid-email-format",
        "password": "Password123!",
        "role": "Researcher",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_short_password_returns_422():
    payload = {
        "name": "Test User",
        "email": "test@domain.com",
        "password": "123",
        "role": "Researcher",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_user_login_success():
    # Register user
    reg_payload = {
        "name": "Maria Curie",
        "email": "maria@lab.org",
        "password": "RadioactivePassword!456",
        "role": "Innovation Manager",
    }
    client.post("/api/auth/register", json=reg_payload)

    # Login user
    login_payload = {
        "email": "maria@lab.org",
        "password": "RadioactivePassword!456",
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "Innovation Manager"


def test_login_invalid_password_returns_401():
    reg_payload = {
        "name": "Maria Curie",
        "email": "maria2@lab.org",
        "password": "CorrectPassword123!",
        "role": "Researcher",
    }
    client.post("/api/auth/register", json=reg_payload)

    login_payload = {
        "email": "maria2@lab.org",
        "password": "WrongPassword999!",
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401


def test_get_current_user_profile():
    reg_payload = {
        "name": "Admin User",
        "email": "admin@platform.com",
        "password": "AdminSecretPassword!789",
        "role": "Administrator",
    }
    client.post("/api/auth/register", json=reg_payload)

    login_payload = {
        "email": "admin@platform.com",
        "password": "AdminSecretPassword!789",
    }
    login_resp = client.post("/api/auth/login", json=login_payload)
    token = login_resp.json()["access_token"]

    profile_resp = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert profile_resp.status_code == 200
    data = profile_resp.json()
    assert data["success"] is True
    assert data["data"]["email"] == "admin@platform.com"
    assert data["data"]["role"] == "Administrator"
