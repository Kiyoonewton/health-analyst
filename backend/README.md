# Healthalyst — Backend API

Node.js + TypeScript + Express backend for the dental appointment booking
app. Role-based access control (patient vs. clinic staff) is enforced in
every query, not just in the UI.

## Stack

- Express (TypeScript)
- SQLite via `better-sqlite3` (raw SQL, no ORM — see `src/db/schema.sql`)
- JWT session cookie (httpOnly) + bcrypt password hashing
- Zod for request validation

## Setup

```bash
cd backend
npm install
cp .env.example .env        # set a real JWT_SECRET before deploying anywhere
npm run seed                 # creates dev.db with demo clinics/accounts
npm run dev                  # http://localhost:4000
```

Demo accounts (all use password `password123`):

| Email                       | Role    | Clinic                     |
|------------------------------|---------|-----------------------------|
| `patient@test.test`          | PATIENT | —                            |
| `staff@healthalyst.test`     | STAFF   | Healthalyst Dental Clinic   |
| `staff@familycare.test`      | STAFF   | Family Care Dental          |

## How role-based access is enforced

- Every request is authenticated by reading a JWT from an httpOnly cookie
  (`src/middleware/auth.ts`), never from anything the client claims in the
  body.
- **Patients** only ever get rows `WHERE patient_id = req.user.sub`. There
  is no route that lets a patient query by another patient's id.
- **Staff** only ever get rows `WHERE clinic_id = req.user.clinicId`. A
  staff account not linked to a clinic can't hit any booking route at all.
- Fetching a single booking by id checks ownership in the same `WHERE`
  clause — a mismatched id returns a plain 404, not a 403, so the API
  never confirms that a booking belonging to someone else exists.
- Creating a booking always sets `patient_id` from the session, so a
  patient can't book on someone else's behalf even by editing the request
  payload.

This was verified end-to-end: a booking created by the patient at
Healthalyst shows up immediately for `staff@healthalyst.test` and is
completely invisible (404, empty list) to `staff@familycare.test`.

## API

All routes are prefixed `/api`. Requests/responses are JSON; the session
cookie is set on register/login and read on every subsequent request.

| Method | Path                         | Who            | Description                          |
|--------|------------------------------|----------------|---------------------------------------|
| POST   | `/auth/register/patient`     | public         | Create a patient account              |
| POST   | `/auth/register/staff`       | public         | Create a staff account (join or create a clinic) |
| POST   | `/auth/login`                | public         | Log in                                |
| POST   | `/auth/logout`               | any            | Log out                               |
| GET    | `/auth/me`                   | any            | Current user                          |
| GET    | `/clinics`                   | any (logged in)| Clinics + their services              |
| POST   | `/clinics/services`          | staff          | Add a service to your own clinic      |
| POST   | `/bookings`                  | patient        | Create a booking                      |
| GET    | `/bookings/mine`              | patient        | Your own bookings                     |
| PATCH  | `/bookings/:id/cancel`       | patient        | Cancel your own booking               |
| GET    | `/bookings/clinic`            | staff          | Bookings for your clinic (`?status=`, `?date=YYYY-MM-DD`) |
| PATCH  | `/bookings/:id/status`       | staff          | Confirm/cancel/complete a booking in your clinic |
| GET    | `/bookings/:id`               | patient/staff  | Single booking (ownership-checked)    |

## Project layout

```
backend/
  src/
    db/            schema.sql + connection + seed script
    lib/            auth (jwt/bcrypt) + zod validators
    middleware/     requireAuth / requireRole
    controllers/    auth / clinic / booking handlers
    routes/         Express routers
    index.ts        app entry point
```

## Notes

- Swapping SQLite for Postgres/MySQL later just means replacing
  `src/db/index.ts` and the SQL strings in the controllers with your
  driver of choice — the route/middleware/RBAC layer doesn't change.
- CORS is configured via `CORS_ORIGINS` in `.env` — add your Expo dev
  server URL (or production frontend URL) there. `credentials: true` is
  required so the browser/app sends the session cookie.
