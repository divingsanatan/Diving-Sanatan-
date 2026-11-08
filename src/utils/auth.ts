import crypto from "crypto";

/**
 * Password hashing.
 *
 * New passwords use scrypt with a random salt:  scrypt$N$r$p$salt$hash
 * Old accounts still hold an unsalted SHA-256 hash. They keep working, and are quietly
 * upgraded to scrypt the next time that user logs in (see needsRehash).
 */
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  if (!password) return "";
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

const legacySha256 = (password: string) => crypto.createHash("sha256").update(password).digest("hex");

const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && crypto.timingSafeEqual(a, b);

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!password || !stored) return false;

  if (stored.startsWith("scrypt$")) {
    const [, n, r, p, salt, hash] = stored.split("$");
    try {
      const expected = Buffer.from(hash, "base64");
      const actual = crypto.scryptSync(password, Buffer.from(salt, "base64"), expected.length, {
        N: Number(n),
        r: Number(r),
        p: Number(p),
      });
      return safeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  // Legacy unsalted SHA-256 (64 hex characters)
  if (/^[0-9a-f]{64}$/i.test(stored)) {
    return safeEqual(Buffer.from(legacySha256(password), "hex"), Buffer.from(stored.toLowerCase(), "hex"));
  }
  return false;
}

/** True when a stored hash should be replaced with a modern one after a successful login. */
export const needsRehash = (stored: string | null | undefined) => !!stored && !stored.startsWith("scrypt$");

/** A strong, human-typable random password (no look-alike characters). */
export function randomPassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (const b of crypto.randomBytes(length)) out += alphabet[b % alphabet.length];
  return out;
}
