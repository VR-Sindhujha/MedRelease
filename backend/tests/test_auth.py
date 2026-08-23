from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_and_login():
    email = "test_medrelease@example.com"

    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "full_name": "Test Admin",
            "password": "StrongPass123!",
        },
    )
    assert response.status_code in (201, 409)

    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "StrongPass123!"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
