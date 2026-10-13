# Vercel deployment checklist

## What deploys where

| Piece | Host |
|-------|------|
| Next.js UI (`frontend/`) | Vercel |
| FastAPI Core API + AI Pipeline + Worker | Your server / Docker / AWS ECS (not Vercel) |

## Vercel project settings

- **Root Directory:** `frontend`
- **Build Command:** `next build` (default)
- **Install Command:** `npm install` (default)
- **Env:** `NEXT_PUBLIC_API_URL`

## After first deploy

1. Copy the Vercel URL (e.g. `https://ai-commerce-insights.vercel.app`).
2. On the API host, add that origin to `CORS_ORIGINS`.
3. Redeploy frontend if you change `NEXT_PUBLIC_API_URL`.

## Local API + Vercel UI (quick test)

Run core-api publicly (tunnel or cloud) and set `NEXT_PUBLIC_API_URL` to that URL. Localhost-only APIs are not reachable from Vercel’s browsers for other users.
