import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { db, ClinicRow, ServiceRow } from "../db";
import { createServiceSchema } from "../lib/validators";

const listClinicsStmt = db.prepare("SELECT * FROM clinics ORDER BY name ASC");
const servicesForClinicStmt = db.prepare("SELECT * FROM services WHERE clinic_id = ?");
const insertServiceStmt = db.prepare(
  "INSERT INTO services (id, clinic_id, name, duration_minutes) VALUES (@id, @clinicId, @name, @durationMinutes)"
);

// Requires login (any role) — populates the clinic + service pickers in
// the patient booking form.
export async function listClinics(_req: Request, res: Response) {
  const clinics = listClinicsStmt.all() as ClinicRow[];
  const withServices = clinics.map((clinic) => ({
    id: clinic.id,
    name: clinic.name,
    address: clinic.address,
    services: (servicesForClinicStmt.all(clinic.id) as ServiceRow[]).map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.duration_minutes,
    })),
  }));
  return res.json({ clinics: withServices });
}

// Staff-only: add a service their own clinic offers.
export async function createService(req: Request, res: Response) {
  const parsed = createServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const clinicId = req.user!.clinicId!;
  const id = randomUUID();
  insertServiceStmt.run({ id, clinicId, name: parsed.data.name, durationMinutes: parsed.data.durationMinutes });
  return res.status(201).json({ service: { id, clinicId, ...parsed.data } });
}
