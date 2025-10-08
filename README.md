# AetherDock (Starter)

Local educational container intelligence platform — starter skeleton.

## Quick start (local)
1. Create & activate a Python virtualenv:
   - `python3 -m venv .venv && source .venv/bin/activate` (Linux/macOS)
   - `. .venv\Scripts\Activate.ps1` (Windows PowerShell)
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run the API:
   - `python backend/api/app.py`
4. Run the collector (in another terminal):
   - `python backend/collector/run.py`

Visit `http://127.0.0.1:5000`.

## Project layout
- `backend/collector/` — data collector service
- `backend/api/` — Flask API
- `frontend/` — HTML/JS templates and static assets
- `aetherdock.db` — SQLite DB (created by collector)
