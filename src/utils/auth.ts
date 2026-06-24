import crypto from "crypto";

/**
 * Hashes a plaintext password using SHA-256
 */
export function hashPassword(password: string): string {
  if (!password) return "";
  return crypto.createHash("sha256").update(password).digest("hex");
}
