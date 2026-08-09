import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { db, ClinicRow, UserRow } from "../db";
import { AUTH_COOKIE_NAME, hashPassword, signToken, verifyPassword } from "../lib/auth";
import { loginSchema, registerPatientSchema, registerStaffSchema } from "../lib/validators";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry
};

function publicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    clinicId: user.clinic_id,
  };
}

const findUserByEmail = db.prepare("SELECT * FROM users WHERE email = ?");
const insertUser = db.prepare(
  `INSERT INTO users (id, name, email, phone, password_hash, role, clinic_id)
   VALUES (@id, @name, @email, @phone, @passwordHash, @role, @clinicId)`
);
const findClinicById = db.prepare("SELECT * FROM clinics WHERE id = ?");
const insertClinic = db.prepare(
  "INSERT INTO clinics (id, name, address) VALUES (@id, @name, @address)"
);

export async function registerPatient(req: Request, res: Response) {
  const parsed = registerPatientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, phone, password } = parsed.data;

  if (findUserByEmail.get(email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  insertUser.run({ id, name, email, phone: phone ?? null, passwordHash, role: "PATIENT", clinicId: null });
  const user = findUserByEmail.get(email) as UserRow;

  const token = signToken({ sub: user.id, role: user.role, clinicId: null });
  res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTS);
  return res.status(201).json({ user: publicUser(user), token });
}

export async function registerStaff(req: Request, res: Response) {
  const parsed = registerStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password, clinicId, clinicName, clinicAddress } = parsed.data;

  if (findUserByEmail.get(email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  let resolvedClinicId = clinicId;
  if (!resolvedClinicId) {
    const newClinic = { id: randomUUID(), name: clinicName!, address: clinicAddress! };
    insertClinic.run(newClinic);
    resolvedClinicId = newClinic.id;
  } else {
    const clinic = findClinicById.get(resolvedClinicId);
    if (!clinic) {
      return res.status(404).json({ error: "Clinic not found." });
    }
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  insertUser.run({
    id,
    name,
    email,
    phone: null,
    passwordHash,
    role: "STAFF",
    clinicId: resolvedClinicId,
  });
  const user = findUserByEmail.get(email) as UserRow;

  const token = signToken({ sub: user.id, role: user.role, clinicId: resolvedClinicId });
  res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTS);
  return res.status(201).json({ user: publicUser(user), token });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const user = findUserByEmail.get(email) as UserRow | undefined;
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken({ sub: user.id, role: user.role, clinicId: user.clinic_id });
  res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTS);
  return res.json({ user: publicUser(user), token });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME);
  return res.json({ ok: true });
}

const findUserById = db.prepare("SELECT * FROM users WHERE id = ?");

export async function me(req: Request, res: Response) {
  const user = findUserById.get(req.user!.sub) as UserRow | undefined;
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  return res.json({ user: publicUser(user) });
}
