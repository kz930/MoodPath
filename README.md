# MindPath MVP

FastAPI backend with JWT auth, rule-based agents, and a web UI for check-ins and guided practices.

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open in the browser:

- **Web UI:** http://127.0.0.1:8000/ui — sign up / log in, dashboard, check-in, practice writing, profile & journals
- Root: http://127.0.0.1:8000/ (JSON with links)
- Swagger: http://127.0.0.1:8000/docs

Use **127.0.0.1** (localhost), not `128.0.0.1`.

## API (selected)

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /interventions/catalog` — core exercises + curriculum items (see `app/catalog.py`, `app/catalog_wb2.py`)
- `POST /checkin`, `GET /daily-plan`, `GET /timeline` (Bearer auth)
- `POST /practice/submit` — save responses + reflection
- `GET /me/journals`, `GET /me/practices?date=…`, `GET /me/practice-dates`

Set `MINDPATH_SECRET` in production for JWT signing.

## Notes

- Storage is in-memory (`app/storage.py`) for the MVP.
- Postgres schema is in `sql/schema.sql` (not wired yet).
- `app/orchestrator.py` runs: check-in → analyze → intervention → risk.
