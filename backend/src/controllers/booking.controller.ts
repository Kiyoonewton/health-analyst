import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { db, BookingStatus } from "../db";
import { createBookingSchema, updateBookingStatusSchema } from "../lib/validators";

// Joined row shape shared by every SELECT below.
interface JoinedBookingRow {
  id: string;
  patient_id: string;
  clinic_id: string;
  service_id: string;
  timeslot: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  service_name: string;
  service_duration: number;
  clinic_name: string;
  clinic_address: string;
}

const SELECT_BOOKING = `
  SELECT
    b.id, b.patient_id, b.clinic_id, b.service_id, b.timeslot, b.status, b.notes,
    b.created_at, b.updated_at,
    u.name AS patient_name, u.email AS patient_email, u.phone AS patient_phone,
    s.name AS service_name, s.duration_minutes AS service_duration,
    c.name AS clinic_name, c.address AS clinic_address
  FROM bookings b
  JOIN users u ON u.id = b.patient_id
  JOIN services s ON s.id = b.service_id
  JOIN clinics c ON c.id = b.clinic_id
`;

function toDto(row: JoinedBookingRow) {
  return {
    id: row.id,
    timeslot: row.timeslot,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    patient: { id: row.patient_id, name: row.patient_name, email: row.patient_email, phone: row.patient_phone },
    service: { id: row.service_id, name: row.service_name, durationMinutes: row.service_duration },
    clinic: { id: row.clinic_id, name: row.clinic_name, address: row.clinic_address },
  };
}

const findServiceInClinic = db.prepare("SELECT id FROM services WHERE id = ? AND clinic_id = ?");
const insertBooking = db.prepare(
  `INSERT INTO bookings (id, patient_id, clinic_id, service_id, timeslot, notes)
   VALUES (@id, @patientId, @clinicId, @serviceId, @timeslot, @notes)`
);
const selectByIdForPatient = db.prepare(`${SELECT_BOOKING} WHERE b.id = ? AND b.patient_id = ?`);
const selectByIdForClinic = db.prepare(`${SELECT_BOOKING} WHERE b.id = ? AND b.clinic_id = ?`);
const selectAllForPatient = db.prepare(`${SELECT_BOOKING} WHERE b.patient_id = ? ORDER BY b.timeslot ASC`);
const updateStatusStmt = db.prepare(
  "UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?"
);

/**
 * PATIENT creates a booking for themself. patientId comes from req.user,
 * never from the request body — a patient cannot book on behalf of
 * anyone else even if they pass a different patientId in the payload.
 */
export async function createBooking(req: Request, res: Response) {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { clinicId, serviceId, timeslot, notes } = parsed.data;

  if (!findServiceInClinic.get(serviceId, clinicId)) {
    return res.status(400).json({ error: "That service does not belong to the selected clinic." });
  }

  const id = randomUUID();
  insertBooking.run({
    id,
    patientId: req.user!.sub,
    clinicId,
    serviceId,
    timeslot: new Date(timeslot).toISOString(),
    notes: notes ?? null,
  });

  const row = selectByIdForPatient.get(id, req.user!.sub) as JoinedBookingRow;
  return res.status(201).json({ booking: toDto(row) });
}

/**
 * PATIENT: only ever returns bookings where patient_id === req.user.sub.
 * There is no code path here that can return another patient's bookings.
 */
export async function listMyBookings(req: Request, res: Response) {
  const rows = selectAllForPatient.all(req.user!.sub) as JoinedBookingRow[];
  return res.json({ bookings: rows.map(toDto) });
}

/**
 * STAFF: only ever returns bookings where clinic_id === req.user.clinicId.
 * Supports optional ?status= and ?date=YYYY-MM-DD filters for the admin view.
 */
export async function listClinicBookings(req: Request, res: Response) {
  const clinicId = req.user!.clinicId!;
  const { status, date } = req.query as { status?: string; date?: string };

  let sql = `${SELECT_BOOKING} WHERE b.clinic_id = ?`;
  const params: unknown[] = [clinicId];

  if (status) {
    sql += " AND b.status = ?";
    params.push(status);
  }
  if (date && !Number.isNaN(Date.parse(date))) {
    sql += " AND b.timeslot >= ? AND b.timeslot <= ?";
    params.push(`${date}T00:00:00.000Z`, `${date}T23:59:59.999Z`);
  }
  sql += " ORDER BY b.timeslot ASC";

  const rows = db.prepare(sql).all(...params) as JoinedBookingRow[];
  return res.json({ bookings: rows.map(toDto) });
}

/**
 * Fetch a single booking. A patient may only fetch their own; staff may
 * only fetch one belonging to their own clinic. Both checks happen in the
 * WHERE clause, so a mismatched booking simply doesn't come back (404,
 * not 403 — we don't reveal that the id exists at all).
 */
export async function getBooking(req: Request, res: Response) {
  const { id } = req.params;
  const row =
    req.user!.role === "PATIENT"
      ? (selectByIdForPatient.get(id, req.user!.sub) as JoinedBookingRow | undefined)
      : (selectByIdForClinic.get(id, req.user!.clinicId!) as JoinedBookingRow | undefined);

  if (!row) {
    return res.status(404).json({ error: "Booking not found." });
  }
  return res.json({ booking: toDto(row) });
}

/**
 * STAFF updates status (confirm/cancel/complete) for a booking that must
 * belong to their own clinic.
 */
export async function updateBookingStatus(req: Request, res: Response) {
  const parsed = updateBookingStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { id } = req.params;
  const clinicId = req.user!.clinicId!;

  const existing = selectByIdForClinic.get(id, clinicId);
  if (!existing) {
    return res.status(404).json({ error: "Booking not found." });
  }

  updateStatusStmt.run(parsed.data.status, id);
  const row = selectByIdForClinic.get(id, clinicId) as JoinedBookingRow;
  return res.json({ booking: toDto(row) });
}

/**
 * PATIENT cancels their own upcoming booking (self-service cancel, distinct
 * from staff being able to set any status).
 */
export async function cancelMyBooking(req: Request, res: Response) {
  const { id } = req.params;
  const existing = selectByIdForPatient.get(id, req.user!.sub) as JoinedBookingRow | undefined;
  if (!existing) {
    return res.status(404).json({ error: "Booking not found." });
  }
  if (existing.status === "COMPLETED") {
    return res.status(400).json({ error: "A completed booking can't be cancelled." });
  }

  updateStatusStmt.run("CANCELLED", id);
  const row = selectByIdForPatient.get(id, req.user!.sub) as JoinedBookingRow;
  return res.json({ booking: toDto(row) });
}
