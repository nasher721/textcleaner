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

### Inference enhancements
- `POST /api/infer` now accepts `keep_threshold` (0.0-1.0) to control sentence retention strictness.
- `POST /api/infer/batch` runs inference over up to 100 texts per request.
- `GET /api/inference-runs` returns recent inference run history with parsed output/confidence JSON.


## CLI
```bash
python scripts/mednotecleaner_cli.py infer --model latest --in input.txt --out output.json --cleaned cleaned.txt --keep-threshold 0.6
python scripts/mednotecleaner_cli.py infer-batch --model latest --in many_notes.txt --out batch_output.json --keep-threshold 0.6
python scripts/mednotecleaner_cli.py train --max-steps 2000
python scripts/mednotecleaner_cli.py export --out dataset.jsonl
```

## Tests
```bash
pytest backend/tests -q
cd frontend && npm run test:e2e
```
