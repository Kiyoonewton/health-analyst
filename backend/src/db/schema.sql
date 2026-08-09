-- Dental Appointment Booking — data model
--
-- Role-based access is enforced in application code (see middleware/auth.ts
-- and controllers/booking.controller.ts), but the schema itself supports it:
-- every booking carries both patient_id and clinic_id, so a query scoped by
-- either one naturally excludes everyone else's data.

CREATE TABLE IF NOT EXISTS clinics (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  address    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('PATIENT', 'STAFF')),
  -- Only set (and only meaningful) when role = 'STAFF'. This column is the
  -- entire basis for "staff only see bookings for their own clinic".
  clinic_id     TEXT REFERENCES clinics(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id);

CREATE TABLE IF NOT EXISTS services (
  id               TEXT PRIMARY KEY,
  clinic_id        TEXT NOT NULL REFERENCES clinics(id),
  name             TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30
);
CREATE INDEX IF NOT EXISTS idx_services_clinic ON services(clinic_id);

CREATE TABLE IF NOT EXISTS bookings (
  id         TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES users(id),
  clinic_id  TEXT NOT NULL REFERENCES clinics(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  timeslot   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'PENDING'
             CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_patient ON bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_clinic ON bookings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bookings_clinic_timeslot ON bookings(clinic_id, timeslot);
