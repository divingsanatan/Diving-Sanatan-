import crypto from "crypto";
import { NextResponse } from "next/server";

/**
 * Server-verified login sessions.
 *
 * At login the server sets a signed, HttpOnly cookie. Every protected API route calls
 * requireUser / requireRoles, which verify that cookie. Nothing the browser sends in a
 * request body (like a "role") is ever trusted for permissions.
 *
 * Secret: AUTH_SECRET, else ADMIN_TOKEN_SECRET, else SUPABASE_SERVICE_ROLE_KEY.
 * With no secret at all, protected routes refuse every request (fail closed).
 */

export const SESSION_COOKIE = "ds_session";
/** Full admin powers. */
export const STAFF_ROLES = ["super_admin", "admin", "subadmin"];
/** Anyone allowed inside the admin panel (staff + gurus). */
export const PANEL_ROLES = [...STAFF_ROLES, "guru"];

export interface SessionUser {
  id: string;
  role: string;
  email: string;
  name?: string;
}

const HOUR = 60 * 60;
/** Panel users re-authenticate daily; ordinary members stay signed in for 30 days. */
export const sessionTtl = (role: string) => (PANEL_ROLES.includes(role) ? 12 * HOUR : 30 * 24 * HOUR);

function signingKey(): Buffer | null {
  const secret =
    process.env.AUTH_SECRET || process.env.ADMIN_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update("divingsanatan-session-v2").digest();
}

const b64u = (input: string | Buffer) => Buffer.from(input).toString("base64url");

export function signSession(user: SessionUser): string | null {
  const key = signingKey();
  if (!key || !user.id) return null;
  const payload = b64u(
    JSON.stringify({
      id: String(user.id),
      role: String(user.role || "user"),
      email: String(user.email || "").toLowerCase(),
      name: user.name || "",
      exp: Math.floor(Date.now() / 1000) + sessionTtl(String(user.role || "user")),
    })
  );
  return `${payload}.${b64u(crypto.createHmac("sha256", key).update(payload).digest())}`;
}

export function verifySession(token: string): SessionUser | null {
  const key = signingKey();
  if (!key || !token || token.length > 2000) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = crypto.createHmac("sha256", key).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!d || typeof d.exp !== "number" || d.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: d.id, role: d.role, email: d.email, name: d.name };
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}

/** The verified user behind this request, or null. */
export function getSession(req: Request): SessionUser | null {
  const token = readCookie(req, SESSION_COOKIE);
  return token ? verifySession(token) : null;
}

/** Adds the login cookie to a response. No-op (returns false) if signing isn't configured. */
export function attachSession(res: NextResponse, user: SessionUser): boolean {
  const token = signSession(user);
  if (!token) return false;
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtl(user.role || "user"),
  });
  return true;
}

export function clearSession(res: NextResponse) {
  res.cookies.set({ name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

type Guard = { ok: true; user: SessionUser } | { ok: false; response: NextResponse };

const fail = (status: number, code: string, error: string): Guard => ({
  ok: false,
  response: NextResponse.json({ success: false, code, error }, { status }),
});

/** Any signed-in user. */
export function requireUser(req: Request): Guard {
  if (!signingKey()) {
    return fail(503, "not_configured", "Login security is not configured on the server. Set ADMIN_TOKEN_SECRET and redeploy.");
  }
  const user = getSession(req);
  return user ? { ok: true, user } : fail(401, "unauthorized", "Please sign in to continue.");
}

/** A signed-in user holding one of the given roles. */
export function requireRoles(req: Request, roles: string[]): Guard {
  const g = requireUser(req);
  if (!g.ok) return g;
  return roles.includes(g.user.role) ? g : fail(403, "forbidden", "You do not have permission to do that.");
}

export const requireStaff = (req: Request) => requireRoles(req, STAFF_ROLES);
export const requirePanel = (req: Request) => requireRoles(req, PANEL_ROLES);
