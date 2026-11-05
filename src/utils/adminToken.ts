import crypto from "crypto";
import { NextResponse } from "next/server";

/**
 * Signed admin tokens.
 *
 * The site's login returns a profile but no credential the server can verify, so
 * admin APIs cannot know who is calling. This adds a small HMAC-signed token that is
 * issued at login and checked on every shop write.
 *
 * Secret: ADMIN_TOKEN_SECRET (recommended). Falls back to SUPABASE_SERVICE_ROLE_KEY.
 * If neither exists, tokens are NOT issued and protected routes refuse every request
 * (fail closed).
 */

export const SHOP_ROLES = ["super_admin", "admin", "subadmin"];

export interface AdminTokenUser {
  id: string;
  role: string;
  email?: string;
}

function signingKey(): Buffer | null {
  const secret = process.env.ADMIN_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update("divingsanatan-admin-token-v1").digest();
}

const b64u = (input: string | Buffer) => Buffer.from(input).toString("base64url");

export function signAdminToken(user: AdminTokenUser, ttlSeconds = 8 * 60 * 60): string | null {
  const key = signingKey();
  if (!key || !SHOP_ROLES.includes(user.role)) return null;
  const payload = b64u(
    JSON.stringify({ id: user.id, role: user.role, email: user.email || "", exp: Math.floor(Date.now() / 1000) + ttlSeconds })
  );
  const sig = b64u(crypto.createHmac("sha256", key).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): (AdminTokenUser & { exp: number }) | null {
  const key = signingKey();
  if (!key || !token || token.length > 2000) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = crypto.createHmac("sha256", key).update(payload).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data || typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (!SHOP_ROLES.includes(data.role)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Use at the top of every protected route handler. */
export function requireAdmin(
  req: Request
): { ok: true; user: AdminTokenUser } | { ok: false; response: NextResponse } {
  if (!signingKey()) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: "not_configured", error: "Shop admin is not configured on the server. Set ADMIN_TOKEN_SECRET and redeploy." },
        { status: 503 }
      ),
    };
  }
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const user = token ? verifyAdminToken(token) : null;
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, code: "unauthorized", error: "Your admin session has expired. Please sign in again." },
        { status: 401 }
      ),
    };
  }
  return { ok: true, user };
}
