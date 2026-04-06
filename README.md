# Floxo App

Customer-facing web application for [Floxo](https://floxo.io) — spatial intelligence for physical spaces.

## Tech Stack

- **Framework:** Vite + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Auth:** Supabase Auth
- **Charts:** Recharts
- **Deployment:** Vercel

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_URL` | Floxo API base URL |

## Branch Strategy

| Branch | Environment |
| --- | --- |
| `main` | Production (app.floxo.io) |
| `test` | Staging / QA |
| `development` | Active development |
