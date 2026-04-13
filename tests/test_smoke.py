from __future__ import annotations

import uuid
from datetime import date

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root_lists_ui() -> None:
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("ui") == "/ui"


def test_ui_serves_html() -> None:
    r = client.get("/ui")
    assert r.status_code == 200
    assert "text/html" in r.headers.get("content-type", "")
    assert b"MindPath" in r.content


def _register_and_token(username: str, password: str) -> str:
    r = client.post("/auth/register", json={"username": username, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]


def test_auth_flow_and_daily_plan() -> None:
    username = f"u_smoke_{uuid.uuid4().hex[:10]}"
    password = "secret12"
    token = _register_and_token(username, password)

    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["username"] == username

    d = date(2026, 4, 13)
    payload = {
        "journal_text": "今天开会前很紧张，压力很大。",
        "mood_tags": ["stress"],
        "sleep_hours": 5.5,
        "energy_score": 4,
        "stress_score": 8,
    }
    r1 = client.post(f"/checkin?target_date={d.isoformat()}", json=payload, headers=headers)
    assert r1.status_code == 200

    r2 = client.get(f"/daily-plan?target_date={d.isoformat()}", headers=headers)
    assert r2.status_code == 200
    data = r2.json()
    assert "emotion" in data
    assert "intervention" in data
    assert data["intervention"]["selected_intervention"] in (
        "gratitude",
        "best_possible_self",
        "cognitive_reframing",
        "savoring",
        "breathing_grounding",
    )

    r3 = client.get("/me/journals?page=1&per_page=5", headers=headers)
    assert r3.status_code == 200
    j = r3.json()
    assert j["total"] >= 1

    sub = {
        "date": d.isoformat(),
        "intervention_type": "gratitude",
        "completed": True,
        "helpfulness": 4,
        "responses": {"g1": "test"},
        "notes": "",
    }
    r4 = client.post("/practice/submit", json=sub, headers=headers)
    assert r4.status_code == 200

    r5 = client.get(f"/me/practices?date={d.isoformat()}", headers=headers)
    assert r5.status_code == 200
    assert len(r5.json()["practices"]) >= 1


def test_checkin_requires_auth() -> None:
    r = client.post(
        f"/checkin?target_date={date.today().isoformat()}",
        json={
            "journal_text": "",
            "mood_tags": [],
            "sleep_hours": 7,
            "energy_score": 5,
            "stress_score": 5,
        },
    )
    assert r.status_code == 401
