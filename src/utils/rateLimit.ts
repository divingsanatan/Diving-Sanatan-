/**
 * Tiny in-memory rate limiter. Each server instance keeps its own counts, so this is a
 * speed bump against guessing, not a hard guarantee. Returns true when the call is allowed.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
