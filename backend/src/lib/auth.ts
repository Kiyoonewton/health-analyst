import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "../db";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Copy .env.example to .env and set it.");
}

export const AUTH_COOKIE_NAME = "dental_session";

export interface AuthTokenPayload {
  sub: string; // user id
  role: Role;
  clinicId: string | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET!) as AuthTokenPayload;
}
