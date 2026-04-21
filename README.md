# JOB TRACKER

JOB TRACKER is a full-stack web application for managing a personal job-search pipeline.  
It helps users track applications from first submission to final outcome, with a clear dashboard view, status-based filtering, and fast in-context editing.

## Project Overview

- **Purpose:** Keep job applications organized in one focused workspace.
- **Core flow:** Register or sign in, add applications, update status over time, and monitor progress from the dashboard.
- **UX focus:** Smooth dashboard-first actions with modal-based create/change-password flows, lightweight navigation, and responsive layouts.

## Main Capabilities

- User authentication with secure session handling.
- Application lifecycle management (create, read, update, delete).
- Status segmentation across pipeline stages (Applied, Interview, Offer, Rejected, Ghosted).
- Dashboard analytics and totals for quick decision support.
- Curated job-board shortcuts integrated in the interface.

## Architecture

- **Monorepo structure**
  - `frontend`: Next.js application (App Router UI layer)
  - `backend`: Express API with Prisma data layer
- **Data model**
  - `User` entity with credential hash and ownership of applications
  - `Application` entity containing role details, salary range, links, notes, and status

## Technologies Used

### Frontend

- Next.js 16
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4

### Backend

- Node.js 20+
- Express
- Prisma ORM
- PostgreSQL
- JWT (access token + refresh token pattern)
- bcrypt (password hashing)

### Tooling

- ESLint
- Jest
- Docker / Docker Compose

## Container Health Checks

The Docker Compose stack includes service-level health checks to improve startup reliability and runtime observability.

- **PostgreSQL:** Uses `pg_isready` to confirm database readiness.
- **Backend API:** Probes `GET /health` on port `3001`.
- **Frontend UI:** Probes `GET /health` on port `3000`.
- **Startup ordering:** Frontend waits for a healthy backend; backend waits for a healthy database.

## License

See `LICENSE`.
