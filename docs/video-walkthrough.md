# Video Walkthrough Outline And Script

Target length: 10 to 15 minutes.

Use this as the recording guide for the WC Launchpad 2026 Builder Round video. The required video content is:

- Walkthrough of the application
- Overview of the code
- Technical limitations and future plans

## Requirements Cross-Check

Verified on May 30, 2026:

- Backend tests: `pnpm test --runInBand` passed, 15 suites and 24 tests.
- Backend build: `pnpm build` passed.
- Frontend build: `pnpm build` passed.

Patient module:

- Patient account creation: implemented through email/password registration.
- Patient profile details: implemented for name, birthday, weight, height, profile picture upload, contact details, and basic medical history.
- Doctor discovery: implemented with doctor browsing, search, specialization filtering, and availability display during booking.
- AI recommendation: implemented as Care Match, a deterministic symptom-to-specialty recommendation flow.
- Appointment booking: implemented for booking, rescheduling, cancellation, conflict checks, and unavailable slot blocking.
- Real-time notifications: implemented as in-app notifications with recent events and browser alert support; upcoming appointment reminders hydrate on dashboard load.
- Consultation session: implemented with generated Jitsi meeting links.
- Medical records: implemented for appointment history, consultation records, and prescriptions.

Doctor module:

- Doctor profile management: implemented through email/password registration plus bio, specialization, and profile picture upload.
- Medical records access: implemented through patient record and prescription dialogs scoped to appointments.
- Consultation schedule management: implemented through the weekly Consultation Hours planner.
- Restrict unavailable time slots: implemented through availability blocks, booked-slot blocking, and backend conflict validation.
- Real-time notifications: implemented for booking, rescheduling, cancellation, schedule, record, prescription, and upcoming appointment events.
- Consultation notes and prescriptions: implemented through the doctor Notes dialog after an appointment.
- Consultation session: implemented with generated Jitsi meeting links.

Known scope notes:

- Video consultation uses Jitsi instead of a custom video stack, which the prompt allows.
- Care Match is rules-based rather than an LLM-backed clinical triage engine.
- Notifications are in-app/browser notifications, not native mobile push notifications.
- Prescription fields are intentionally simple for the MVP.

## Recording Outline

### 1. Opening And Product Context, 45 seconds

- State the app name and purpose.
- Explain the two roles: patient and doctor.
- Mention the build focus: full-stack MVP, required modules, and a clean demo flow.

### 2. Patient Module Walkthrough, 4 to 5 minutes

- Start at registration and show patient account creation with email/password.
- Open the profile page and show patient details: birthday, weight, height, contact, profile picture, and medical history.
- Go to the dashboard and show the notification center.
- Use Care Match to enter symptoms and show the recommended specialty/doctors.
- Search and filter doctors by specialization.
- Open a doctor booking dialog, show availability, blocked/booked slots, and book an appointment.
- Show patient appointment actions: Join, Reschedule, and Cancel.
- Open profile records and show medical records plus prescriptions.

### 3. Doctor Module Walkthrough, 4 to 5 minutes

- Show doctor registration/profile fields: specialization, bio, and profile picture.
- Open the doctor dashboard.
- Show Consultation Hours and edit weekly availability.
- Explain how unavailable time slots are restricted.
- Show Patient Queue and Consultations.
- Open the generated Jitsi session link with Join.
- Open Records for a patient to show medical history/prescription access.
- Add consultation notes with diagnosis, summary, follow-up instructions, and optional prescription.
- Point back to notifications for schedule and consultation updates.

### 4. Code Overview, 2 to 3 minutes

- Backend modules:
  - `backend/src/auth` for JWT login.
  - `backend/src/account` for shared patient/doctor registration and profile updates.
  - `backend/src/doctor` for discovery, availability, and Care Match.
  - `backend/src/appointments` for booking, rescheduling, cancellation, conflict checks, booked slots, session links, and reminders.
  - `backend/src/records` and `backend/src/prescriptions` for consultation outputs.
  - `backend/src/notifications` for in-app notification events.
- Database:
  - `backend/src/db/schema.ts` defines accounts, patients, doctors, availability blocks, appointments, medical records, and prescriptions.
- Frontend:
  - `frontend/src/app/(auth)` for login/register.
  - `frontend/src/app/dashboard` for patient and doctor workflows.
  - `frontend/src/app/profile` for profile editing, records, and prescriptions.

### 5. Limitations And Future Improvements, 1 to 2 minutes

- Replace deterministic Care Match with clinically safer AI triage and escalation.
- Add persistent notification storage and background scheduled reminders.
- Expand prescriptions with dosage frequency, route, duration, and instructions.
- Add secure file uploads for lab results or images.
- Add richer production hardening: audit logs, secrets management, role-based admin tooling, and observability.

### 6. Closing, 30 seconds

- Restate that the MVP covers all required patient and doctor modules.
- Mention the verification commands passed.
- Close with the product thesis: a small, explainable telehealth workflow that supports both sides of an online consultation.

## Spoken Script

Hi, I’m walking through TeleConsult, my full-stack telehealth MVP for the WC Launchpad 2026 Builder Round.

The product has two main roles: patients and doctors. Patients can register, complete their health profile, find the right doctor, book and manage consultations, join online sessions, and view records or prescriptions. Doctors can manage their profile and availability, review patient records, join consultations, and add notes and prescriptions after an appointment.

I’ll start with the patient workflow.

From the registration page, a patient can create an account using email and password. After logging in, the patient can go to the profile page and complete the information required by the prompt: name, birthday, weight, height, contact details, profile picture, and basic medical history. This gives doctors useful context before the consultation starts.

On the patient dashboard, the first thing to notice is the notification center. Booking confirmations, schedule updates, consultation notes, prescriptions, and upcoming appointment reminders appear here.

For doctor discovery, the patient can browse available doctors, search by name or specialty, and filter by specialization. I also added Care Match. The patient can describe symptoms, such as headache, dizziness, rash, or chest pain, and the app recommends the closest specialty and updates the doctor list. For this MVP, Care Match is deterministic and explainable rather than a black-box clinical AI system.

Now I’ll book a consultation. Opening a doctor shows their available schedule. The slot picker only allows times that fit inside the doctor’s consultation hours, and it also blocks already booked times. After choosing a slot and booking, the appointment appears in the patient’s appointment list.

From here, the patient can join the consultation, reschedule it, or cancel it. The Join button opens a generated Jitsi meeting room, which satisfies the consultation session requirement without building a custom video-conferencing stack.

The patient can also view appointment history, medical records, and prescriptions from the profile page. After a doctor completes notes, the diagnosis, consultation summary, follow-up instructions, and prescription drugs show up here.

Next I’ll switch to the doctor workflow.

A doctor also registers using email and password. In the doctor profile, they can add a specialization, bio, and profile picture, which are shown to patients during discovery and booking.

On the doctor dashboard, the Consultation Hours planner lets the doctor manage weekly availability. The doctor can select working blocks, save them, and those blocks become the only times patients can book. This is also how unavailable time slots are restricted: the frontend shows only valid bookable times, and the backend validates every booking and reschedule request against the doctor’s availability and existing conflicts.

The dashboard also shows a Patient Queue and the doctor’s Consultations list. For each consultation, the doctor can join the same Jitsi session link, review records for that patient, and add consultation notes.

In the notes dialog, the doctor records diagnosis, summary, follow-up instructions, and an optional prescription. When saved, the app creates a medical record and, if medicine is entered, attaches a prescription to that record. The patient is notified that consultation notes or a prescription were added.

Now I’ll quickly show the code structure.

The backend is built with NestJS and TypeScript. Authentication is in `backend/src/auth`, using JWT login. Shared account registration and profile updates are in `backend/src/account`. Doctor discovery, specialization filtering, availability management, and Care Match are in `backend/src/doctor`. Appointment booking, rescheduling, cancellation, conflict checks, booked slots, session links, and upcoming reminders are in `backend/src/appointments`. Consultation records live in `backend/src/records`, prescriptions live in `backend/src/prescriptions`, and notification events are handled in `backend/src/notifications`.

The database uses PostgreSQL with Drizzle. The schema includes accounts, patient profiles, doctor profiles, appointment blocks, appointments, medical records, and prescriptions.

The frontend is built with Next.js and TypeScript. Login and registration are in `frontend/src/app/(auth)`. The main patient and doctor workflows are in `frontend/src/app/dashboard`. Profile editing, medical records, and prescriptions are in `frontend/src/app/profile`.

For technical limitations: first, video consultation currently uses generated Jitsi rooms. That keeps the MVP practical and still meets the prompt, but a production version would need deeper session controls, waiting rooms, and auditability. Second, Care Match is rules-based. I would evolve it into a safer AI triage layer with clinical guardrails, emergency escalation, and explainable recommendations. Third, notifications are in-app and browser-based, not full native push. I would add persistent notification storage and a background reminder worker. Fourth, prescription details are intentionally simple, so future versions should support frequency, route, duration, and patient instructions.

Before recording this, I verified the implementation with backend tests, backend build, and frontend build. The backend test suite passed 15 test suites and 24 tests, and both production builds completed successfully.

That’s TeleConsult: a compact telehealth MVP covering the required patient and doctor modules, with custom APIs, PostgreSQL persistence, and an end-to-end consultation flow from discovery to records and prescriptions.
