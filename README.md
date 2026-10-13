# AI Commerce Insights

Dual-mode AI platform that turns seller/catalog documents into structured commerce insights, catalog entities, and an agentic chat assistant.

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

## Deploy frontend on Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com): **Add New Project** → import the repo.
3. Set **Root Directory** to `frontend` (important — do not deploy the monorepo root).
4. Framework Preset: **Next.js** (auto-detected).
5. Environment variable:
   - `NEXT_PUBLIC_API_URL` = public URL of your Core API (e.g. `https://api.yourdomain.com`)
6. Deploy.

The Python services (`core-api`, `ai-pipeline`, `worker`) are **not** hosted on Vercel. Run them locally, on Docker/ECS, or another host, and point `NEXT_PUBLIC_API_URL` at that API. Ensure the API `CORS_ORIGINS` includes your Vercel domain (e.g. `https://your-app.vercel.app`).

Demo login (after API is reachable): `analyst@demo.com` / `demo1234`

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
