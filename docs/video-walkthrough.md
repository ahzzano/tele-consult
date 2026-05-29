# Video Walkthrough Guide

Target length: 5 to 10 minutes.

## 1. Product Overview

Tele-Consult is a web MVP for online healthcare consultations. It supports two primary users:

- Patients who discover doctors, book consultations, join sessions, and view records.
- Doctors who manage availability, join consultations, and create consultation notes and prescriptions.

## 2. Patient Walkthrough

1. Register as a patient from `/register`.
2. Complete patient profile details: birthday, weight, height, contact details, profile picture URL, and basic medical history.
3. Open `/dashboard`.
4. Use Care Match to describe symptoms and receive a specialty recommendation.
5. Search or filter doctors by specialization.
6. Open a doctor booking dialog and choose an available slot.
7. Show booked-slot behavior by noting unavailable/blocked appointment windows.
8. Show appointment list actions: Join, Reschedule, and Cancel.
9. Open `/profile` and show medical records and prescriptions.

## 3. Doctor Walkthrough

1. Register as a doctor from `/register`.
2. Add specialization and bio.
3. Open `/dashboard`.
4. Use Consultation Hours to set weekly availability.
5. Show Patient Queue and Consultations list.
6. Use Join to open the generated Jitsi consultation room.
7. Add consultation notes after an appointment.
8. Add optional prescription details attached to the record.
9. Show notifications for booking, schedule, notes, prescriptions, and upcoming reminders.

## 4. Code Overview

Backend:

- `backend/src/auth` handles login and JWT auth.
- `backend/src/account` handles shared patient/doctor account registration and profile updates.
- `backend/src/doctor` handles doctor discovery, availability, and Care Match recommendations.
- `backend/src/appointments` handles booking, rescheduling, cancellation, conflict checks, booked slots, session links, and upcoming reminders.
- `backend/src/records` handles consultation notes.
- `backend/src/prescriptions` handles prescriptions tied to medical records.
- `backend/src/notifications` streams real-time in-app notifications with server-sent events.

Frontend:

- `frontend/src/app/(auth)` contains login and registration.
- `frontend/src/app/dashboard` contains patient booking, doctor scheduling, appointments, notifications, and consultation workflows.
- `frontend/src/app/profile` contains profile editing and medical record/prescription display.

## 5. Technical Limitations And Future Work

- Video consultation uses generated Jitsi rooms instead of an in-house video stack.
- Care Match is a deterministic recommendation layer; future versions can integrate an LLM or clinical triage service.
- Notifications are in-app SSE notifications, not operating-system or mobile push notifications.
- Prescription dosage is currently a simple numeric field; future versions should support frequency, duration, route, and instructions.
- Appointment reminders hydrate on dashboard load and stream live events; future versions can add a scheduled job worker.

## 6. Closing

Close by restating that the MVP covers the required patient and doctor journeys and is designed to be small, explainable, and demo-ready.
