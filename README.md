# AI Commerce Insights

Dual-mode AI platform that turns seller/catalog documents into structured commerce insights, catalog entities, and an agentic chat assistant.

## Live demo

**Dashboard:** [https://ai-commerce-insights.vercel.app/dashboard](https://ai-commerce-insights.vercel.app/dashboard)

Self-contained Vercel demo (seeded SQLite + charts, no login).

## Runtime modes

| Mode | When | Storage | Queue | Database | Graph |
|------|------|---------|-------|----------|-------|
| **local** | No AWS creds / `RUNTIME_MODE=local` | Disk `storage/uploads` | In-process | SQLite | SQL tables |
| **aws** | Creds present / `RUNTIME_MODE=aws` | S3 | SQS + worker | Postgres (+ pgvector) | Neo4j |

Adapters live in `shared/shared/` and are selected at startup.

## Quick start (local, no AWS)

```bash
# 1) Python deps
python -m pip install -e ./shared
python -m pip install fastapi "uvicorn[standard]" python-multipart httpx sse-starlette email-validator

# 2) Env + seed
cp .env.example .env
# ensure RUNTIME_MODE=local
python scripts/seed_db.py

# 3) APIs (two terminals)
# Terminal A — core API
cd services/core-api
set PYTHONPATH=../../shared;.
uvicorn app.main:app --reload --port 8100

# Terminal B — AI pipeline (optional; core-api falls back if down)
cd services/ai-pipeline
set PYTHONPATH=../../shared;.
uvicorn app.main:app --reload --port 8001

# 4) Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — API defaults to http://localhost:8100 (port 8000 is often taken).

**Demo users** (password `demo1234`):

- `admin@demo.com` — admin
- `analyst@demo.com` — analyst
- `viewer@demo.com` — viewer

## AWS / LocalStack

See [docs/AWS_DEPLOY.md](docs/AWS_DEPLOY.md).

```bash
docker compose up --build
```

## Deploy full demo on Vercel

Vercel hosts **Next.js only**, not Python workers. This repo’s `frontend/` is a
**self-contained demo**: UI + `/api/v1` routes + seeded SQLite (`frontend/data/demo.db`).
No login — visitors land on the Signal deck with charts and sample data.

1. Root Directory: **`frontend`**
2. Do **not** set `NEXT_PUBLIC_API_URL` (or leave it blank) so the app uses its built-in API
3. Deploy / Redeploy

Optional later: point `NEXT_PUBLIC_API_URL` at a separate FastAPI host for the full AWS/local Python stack. See [docs/VERCEL.md](docs/VERCEL.md).

## Smoke test

With core-api running on :8100:

```bash
python scripts/test_e2e.py
```

## Project layout

```
services/core-api/       # Public REST + chat SSE proxy
services/ai-pipeline/    # Ingest, embeddings, agentic chat, insights
services/worker/         # SQS / job consumer
shared/                  # Models + dual-mode adapters
frontend/                # Next.js UI (Vercel)
scripts/                 # seed_db.py, test_e2e.py
docker-compose.yml       # Postgres + Neo4j + LocalStack + services
docker-compose.local.yml # SQLite-only containers
```

## API overview

- `POST /api/v1/auth/register|login|refresh`
- `GET/PATCH /api/v1/users/me`
- `GET/POST /api/v1/documents` …
- `GET/POST /api/v1/chat/sessions` + SSE messages
- `GET/POST /api/v1/insights`
- `GET /api/v1/catalog/products|sellers|categories|graph`
- `GET /api/v1/dashboard/stats`
- `GET /api/v1/health`
