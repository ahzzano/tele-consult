# Tele-Consult MVP

Full-stack telehealth prototype for the WC Launchpad 2026 Builder Round.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind-style utility classes, Base UI, lucide-react
- Backend: NestJS, TypeScript, Drizzle ORM
- Database: PostgreSQL
- Deployment: Docker Compose with separate frontend, backend, and database services

## Implemented Requirements

### Patient Module

- Patient registration with email/password and profile details
- Patient profile editing for name, birthday, weight, height, profile picture URL, contact details, and medical history
- Doctor discovery with name/specialty search and specialization filter
- Symptom-based Care Match recommendation that maps patient concerns to a relevant specialty
- Appointment booking against doctor availability
- Appointment rescheduling and cancellation
- Booked-slot blocking in the scheduling UI
- Real-time in-app notification stream for booking, schedule, notes, prescriptions, and upcoming appointment reminders
- Join consultation links through generated Jitsi meeting rooms
- Appointment history and medical record/prescription viewing

### Doctor Module

- Doctor registration with email/password, bio, specialization, and profile picture URL
- Doctor profile editing
- Consultation availability planner with restricted unavailable slots
- Doctor appointment queue and consultation list
- Join consultation links through generated Jitsi meeting rooms
- Consultation notes creation after appointments
- Prescription creation attached to consultation records
- Patient record and prescription access for the doctor's own consultations
- Real-time in-app notification stream for booking, schedule, and upcoming appointment updates

## Key App Paths

- `/register` - patient or doctor registration
- `/login` - authentication
- `/dashboard` - patient booking/discovery or doctor scheduling/consultation workflow
- `/profile` - profile, medical records, and prescriptions

## Local Development

Current local hot-reload setup used during development:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:3001`
- Database: PostgreSQL from `backend/.env`

Backend:

```bash
cd backend
pnpm install
pnpm start:dev
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend expects:

```bash
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

## Docker

Docker Compose runs a containerized production-style stack:

- Frontend container: `http://localhost:3000`
- Backend container: `http://localhost:3001`
- PostgreSQL container: `localhost:5432`

Create a root `.env` with:

```bash
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Then run:

```bash
docker compose up --build
```

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

Latest verification:

- Backend tests: 15 suites passed, 20 tests passed
- Backend build: passed
- Frontend build: passed

## Submission Checklist

These items are outside the source tree and still need to be supplied for the Builder Round submission:

- Public deployed app URL
- Git repository URL with access enabled
- Video walkthrough covering the app, code overview, and technical limitations
- Pair programming schedule completion
- Product deck if submitting for the Product Manager track

## Known Product Notes

- Consultation sessions use generated Jitsi rooms instead of a custom video conferencing stack, matching the spec note that a fully custom video solution is not required.
- Care Match is implemented as a deterministic specialty recommendation layer so it remains explainable and demoable without requiring a third-party AI service.
- Notifications are in-app server-sent events plus upcoming reminder hydration; they are not mobile push notifications.
