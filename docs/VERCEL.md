# Vercel deployment checklist

## Full demo on Vercel (current setup)

Vercel cannot run the long-lived Python FastAPI/worker processes. Instead, the
**`frontend`** app includes:

- Next.js UI (no login — opens Signal deck)
- Next.js `/api/v1/*` routes (Node runtime)
- Bundled SQLite seed DB: `frontend/data/demo.db` (copied to `/tmp` on Vercel)

So one Vercel project = a complete working demo with data + charts.

## Vercel project settings

- **Root Directory:** `frontend`
- **Framework:** Next.js
- **Env:** leave `NEXT_PUBLIC_API_URL` **empty / unset** (same-origin demo API)
- Optional: if you later host FastAPI elsewhere, set `NEXT_PUBLIC_API_URL` to that URL

## Redeploy after this update

Push to `main`, then in Vercel click **Redeploy** (or wait for auto-deploy).
