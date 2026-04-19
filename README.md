# JOB TRACKER

Full-stack web app to **track job applications** in one place: register, sign in, add roles with status and details, filter by pipeline stage, and see dashboard totals. The UI also surfaces **quick links to major job boards** (home and dashboard) using shared data and components.

## Monorepo layout

| Directory   | Role |
|------------|------|
| `frontend` | Next.js (App Router) UI — port **3000** in dev |
| `backend`  | Express + Prisma API — port **3001** in dev |

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4, Geist fonts  
- **Backend:** Node 20+, Express, Prisma, PostgreSQL, JWT access tokens + httpOnly refresh cookie, bcrypt  

## Features (high level)

- **Auth:** Register, login, logout; access token in memory with refresh via cookie (see `AccessTokenModule` / `api.ts`).  
- **Applications:** List with **status filters** (All, Applied, Interview, Offer, Rejected, Ghosted), create, edit, delete; stats on the dashboard.  
- **Job boards:** Curated outbound links (LinkedIn Jobs, Indeed, Pracuj.pl, The Protocol, No Fluff Jobs, Just Join IT) — shared list in `frontend/src/lib/job-boards.ts` and `JobBoardLinks` (grid on home, horizontal strip on dashboard).  
- **Navigation:** Back-to-home control on login, register, and dashboard (`AuthBackToHomeLink`).  
- **Branding:** Official name **JOB TRACKER** is centralized in `frontend/src/lib/brand.ts` for titles and metadata; favicon via `frontend/src/app/icon.jpg` and `apple-icon.jpg`.

## Prerequisites

- Node.js **20+**  
- **PostgreSQL** for the API  

## Backend setup

```bash
cd backend
npm install
```

Create a `.env` file (values are examples — use strong secrets in production):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/job_tracker"
JWT_SECRET="your-access-token-secret-at-least-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-at-least-32-chars"
# Optional overrides:
# PORT=3001
# JWT_ACCESS_EXPIRES_IN=15m
# JWT_REFRESH_EXPIRES_IN=7d
# CORS_ORIGIN=http://localhost:3000   # required in production
```

Apply migrations and start the API:

```bash
npx prisma migrate deploy   # or: npm run prisma:migrate -- for dev migrate
npm run dev
```

Health check: `GET http://localhost:3001/health`

## Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Start the app:

```bash
npm run dev
```

Open **http://localhost:3000**. Browser requests to the API use the URL above; CORS on the backend must allow the frontend origin (`CORS_ORIGIN` in production).

## Docker (optional full stack)

From the **repository root**:

```bash
docker compose up --build
```

- **Postgres:** `localhost:5433` → container `5432` (avoids clashing with a Postgres install already on host `5432`). User / password / DB in compose: `tasktracker` / `tasktracker` / `task_manager`.  
- **API:** http://localhost:3001 — runs `prisma migrate deploy` then `node dist/index.js`.  
- **UI:** http://localhost:3000 — built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` so the browser still talks to the API on the host.

Override JWT secrets for anything beyond local throwaway keys:

```bash
JWT_SECRET="..." JWT_REFRESH_SECRET="..." docker compose up --build
```

**Images:** `backend/Dockerfile`, `frontend/Dockerfile` (Next **standalone** output). **Compose:** `docker-compose.yml` at the repo root.

## Scripts (summary)

| Location   | Command        | Purpose        |
|-----------|----------------|----------------|
| `frontend`| `npm run dev`  | Next dev server |
| `frontend`| `npm run build`| Production build |
| `frontend`| `npm run lint` | ESLint         |
| `backend` | `npm run dev`  | API with watch  |
| `backend` | `npm run test` | Jest tests       |
| `backend` | `npm run lint` | ESLint           |

## License

See the repository `LICENSE` file.
