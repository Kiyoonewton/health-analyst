import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "..", "..", "dev.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

// ---- Row types (raw sqlite columns, snake_case) ----

export type Role = "PATIENT" | "STAFF";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface ClinicRow {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: Role;
  clinic_id: string | null;
  created_at: string;
}

export interface ServiceRow {
  id: string;
  clinic_id: string;
  name: string;
  duration_minutes: number;
}

export interface BookingRow {
  id: string;
  patient_id: string;
  clinic_id: string;
  service_id: string;
  timeslot: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
