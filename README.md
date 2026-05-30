# TeleConsult

TeleConsult is a full-stack telehealth MVP built for the WC Launchpad 2026 Builder Round. It supports the core patient and doctor journeys required by the prompt: account creation, doctor discovery, appointment booking, online consultation links, medical records, prescriptions, schedule management, and in-app notifications.

The app is intentionally small and demo-ready. Most product logic lives in custom APIs, while the frontend focuses on a clear patient/doctor workflow that can be shown quickly during evaluation.

## Features

### Patient Module

- Register and log in with email and password
- Add profile details such as birthday, weight, height, contact details, profile photo URL, and basic medical history
- Browse available doctors and view availability
- Search and filter doctors by specialization
- Use Care Match to map symptoms or health concerns to a relevant specialty
- Book, reschedule, and cancel consultations
- Receive in-app notifications for booking, schedule, notes, prescriptions, and upcoming appointment reminders
- Join generated Jitsi consultation rooms
- View appointment history, medical records, and prescriptions

### Doctor Module

- Register and log in with email and password
- Manage doctor profile details, bio, specialization, and profile photo URL
- Manage consultation availability and unavailable time slots
- View patient appointment history and related medical records/prescriptions
- Join generated Jitsi consultation rooms
- Add consultation notes and prescriptions after appointments
- Receive in-app notifications for booked, upcoming, and schedule-related updates

## Tech Stack

- Frontend: Next.js, React, TypeScript, Base UI, lucide-react, utility-first CSS
- Backend: NestJS, TypeScript, Drizzle ORM
- Database: PostgreSQL
- Deployment: Docker Compose for local/containerized runs, with Railway/Vercel-friendly package scripts

## Project Structure

```text
tele-consult/
├── backend/       # NestJS API, Drizzle schema, seed data, tests
├── frontend/      # Next.js app
├── docs/          # Submission notes, deck outline, video walkthrough script
├── compose.yaml   # 3-container Docker setup: db, backend, frontend
└── README.md
```

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 16+ for manual local development
- Docker and Docker Compose for containerized local runs

Install pnpm if needed:

```bash
npm install -g pnpm
```

## Environment Variables

### Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
```

### Frontend

Create `frontend/.env.local`:

```env
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

`BACKEND_URL` is used by server-side actions/pages. `NEXT_PUBLIC_BACKEND_URL` is used by browser-side code such as live notifications.

### Docker Compose

Create a root `.env`:

```env
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Local Development

Run the backend and frontend in separate terminals.

### 1. Start PostgreSQL

Use your local PostgreSQL server or start only the database container:

```bash
docker compose up -d db
```

### 2. Start Backend

```bash
cd backend
pnpm install
pnpm db:push
pnpm db:seed
pnpm start:dev
```

Backend URL:

```text
http://localhost:3000
```

### 3. Start Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend URL:

```text
http://localhost:3001
```

If port `3001` is unavailable, Next.js may choose another port. Update `frontend/.env.local` only if the backend URL changes.

## Docker Setup

The Docker Compose setup runs exactly three application containers:

```text
db        PostgreSQL
backend   NestJS API
frontend  Next.js app
```

Start the full stack:

```bash
docker compose up -d --build
```

The backend runs `pnpm db:push` before starting so a fresh database is synchronized with the current Drizzle schema.

Seed demo data:

```bash
docker compose exec backend pnpm db:seed
```

Open:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001
```

Stop the stack:

```bash
docker compose down
```

Reset all Docker data, including the database volume:

```bash
docker compose down -v --remove-orphans
```

## Demo Accounts

After running `pnpm db:seed`, all seeded users use:

```text
Password123!
```

Example accounts:

```text
Doctor:  dr.rafael.cruz@example.com
Patient: leo.reyes@example.com
```

## Useful Scripts

Backend:

```bash
cd backend
pnpm start:dev    # run NestJS with watch mode
pnpm build        # compile backend
pnpm start:prod   # run compiled backend
pnpm test         # run unit tests
pnpm db:push      # sync current schema to database
pnpm db:migrate   # run Drizzle migrations
pnpm db:seed      # seed demo users, availability, records, prescriptions
```

Frontend:

```bash
cd frontend
pnpm dev          # run Next.js dev server
pnpm build        # build production frontend
pnpm start        # run production frontend
pnpm lint         # run lint checks
```

## Deployment Notes

Recommended split deployment:

```text
Railway:
  - PostgreSQL
  - Backend service from backend/

Vercel:
  - Frontend service from frontend/
```

Backend service settings:

```text
Root directory: backend
Build command: pnpm install --frozen-lockfile && pnpm build
Start command: pnpm db:push && pnpm start:prod
```

Backend environment:

```env
DATABASE_URL=<Railway PostgreSQL URL>
```

Frontend service settings:

```text
Root directory: frontend
Framework: Next.js
```

Frontend environment:

```env
BACKEND_URL=https://your-backend-service-url
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service-url
```

After deploying the backend, seed demo data from the Railway shell or command runner:

```bash
pnpm db:seed
```

### Vercel Backend Notes

The backend can also be deployed as a separate Vercel project from the monorepo:

```text
Root directory: backend
Framework preset: Other / NestJS
Install command: pnpm install --frozen-lockfile
Build command: pnpm build
Output directory: leave blank
```

Required backend environment:

```env
DATABASE_URL=<hosted Postgres URL>
```

For Neon or other hosted Postgres providers, keep SSL enabled in the connection string:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

Run schema sync and seed data against the hosted database before or after deployment:

```bash
cd backend
DATABASE_URL="<hosted Postgres URL>" pnpm db:push
DATABASE_URL="<hosted Postgres URL>" pnpm db:seed
```

If Vercel shows `FUNCTION_INVOCATION_FAILED`, open the backend project in Vercel and check **Runtime Logs**. The generic crash page does not include the real error. The most common cause is a missing or invalid `DATABASE_URL`.

## Verification

Backend:

```bash
cd backend
pnpm test --runInBand
pnpm build
```

Frontend:

```bash
cd frontend
pnpm build
```

Docker:

```bash
docker compose config --services
docker compose up -d --build
docker compose ps
```

Expected Docker services:

```text
db
backend
frontend
```

## Product Notes

- Consultation sessions use generated Jitsi rooms instead of a custom video stack, which matches the project requirement that fully custom video conferencing is not required.
- Care Match is deterministic and specialty-based so it remains explainable during a demo.
- Notifications are implemented as in-app server-sent events plus reminder hydration. They are not native mobile push notifications.
- The app is web-only and desktop-oriented, with responsive layouts for smaller screens.
