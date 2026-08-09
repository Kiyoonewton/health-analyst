import { Request, Response, NextFunction } from "express";
import { Role } from "../db";
import { AUTH_COOKIE_NAME, verifyToken } from "../lib/auth";

/**
 * Reads the session token from either the httpOnly cookie (web) or an
 * `Authorization: Bearer` header (mobile — the Capacitor WebView's origin
 * doesn't reliably receive cross-origin cookies), verifies the JWT, and
 * attaches the decoded payload to req.user. This is the ONLY place a
 * request establishes who it is — every downstream ownership check
 * (patient sees only their own bookings, staff sees only their clinic's)
 * relies on req.user, never on anything the client sends in the request body.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  const token = bearer ?? req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}

/**
 * Restricts a route to one or more roles. Must run after requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have access to this resource." });
    }
    // Defensive check: a STAFF account must always carry a clinicId, or
    // there is nothing to scope their queries to.
    if (req.user.role === "STAFF" && !req.user.clinicId) {
      return res.status(403).json({ error: "Staff account is not linked to a clinic." });
    }
    return next();
  };
}
