# MedNoteCleaner

Local-only offline app for ICU note cleaning + structured extraction.

## Monorepo
- `backend` FastAPI + spaCy + SQLite
- `frontend` Next.js 14 + Tailwind
- `scripts` CLI utilities
- `docker` container setup

## Local run (non-Docker)
### Backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Docker run
```bash
cd docker
docker compose up --build
```

## API
Open docs at `http://localhost:8000/docs`.

## CLI
```bash
python scripts/mednotecleaner_cli.py infer --model latest --in input.txt --out output.json --cleaned cleaned.txt
python scripts/mednotecleaner_cli.py train --max-steps 2000
python scripts/mednotecleaner_cli.py export --out dataset.jsonl
```

## Tests
```bash
pytest backend/tests -q
cd frontend && npm run test:e2e
```
