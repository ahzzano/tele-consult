# Technical Notes

## Architecture

The app uses a split frontend/backend architecture:

- Next.js server and client components for the web experience.
- NestJS modules for auth, account, doctor, appointment, record, prescription, and notification logic.
- PostgreSQL persistence through Drizzle ORM.
- Docker Compose for containerized frontend, backend, and database services.

## Core Backend Decisions

- Account registration creates either a patient or doctor profile from a single registration flow.
- JWT auth protects profile, doctor, appointment, record, prescription, and notification endpoints.
- Appointment validation checks:
  - Doctor exists
  - Patient exists
  - Timeslot is valid
  - Day matches the timeslot date
  - Appointment fits inside doctor availability
  - Doctor and patient do not have overlapping 90-minute consultations
- Consultation sessions are generated from appointment IDs with Jitsi room URLs.
- Notifications use server-sent events for a simple real-time channel without adding WebSocket infrastructure.

## Core Frontend Decisions

- Dashboard adapts to the authenticated account role.
- Patient workflow emphasizes finding care, booking, appointment actions, and record review.
- Doctor workflow emphasizes availability, queue management, joining sessions, and completing notes.
- UI additions reuse the existing card, dialog, button, icon, and form patterns.
- Booked-slot blocking happens before submit so patients get immediate scheduling feedback.

## Verification Commands

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

## Current Limitations

- No custom video infrastructure; Jitsi is used as the session provider.
- Care Match is rules-based and intentionally explainable for the prototype.
- In-app notifications are not persisted after refresh except upcoming appointment reminder hydration.
- No payment, insurance, chat, file upload, or clinical safety escalation workflows.
- No production secrets management beyond environment variables.
