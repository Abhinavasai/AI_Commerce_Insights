# AI Commerce Insights — Frontend

Next.js 14 App Router client for the AI Commerce Insights platform. It talks to the Core API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8100`).

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **DM Sans** + **Fraunces** (Google fonts via `next/font`)
- **Axios** for REST, **fetch** for SSE chat streaming
- **Recharts** for dashboard charts, **react-markdown** for chat and insights

## Getting started

```bash
cd frontend
cp .env.example .env.local   # optional; defaults to localhost:8100
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Ensure the Core API is running on port 8000.

**Demo login:** `analyst@demo.com` / `demo1234`

## Scripts

| Script        | Description              |
|---------------|--------------------------|
| `npm run dev` | Development server       |
| `npm run build` | Production build       |
| `npm run start` | Serve production build |
| `npm run lint`  | ESLint                 |

## Auth

JWT access and refresh tokens are stored in `localStorage`. Protected routes under `(protected)/` use a client-side guard that redirects to `/login`. The API client attaches `Authorization: Bearer …` and attempts token refresh on 401.

## Routes

| Path | Description |
|------|-------------|
| `/login`, `/register` | Authentication |
| `/dashboard` | KPIs and charts from `/api/v1/dashboard/stats` |
| `/documents` | List and upload |
| `/documents/[id]` | Detail and chunks |
| `/chat` | Sessions and SSE streaming chat |
| `/insights`, `/insights/[id]` | Insight cards and detail |
| `/catalog` | Products, sellers, categories, graph viz |
| `/settings` | Profile name and password |

## Deployment (Vercel)

Set `NEXT_PUBLIC_API_URL` to your public Core API origin. Configure the same variable in Vercel project settings (see `vercel.json` placeholder for linked env).
