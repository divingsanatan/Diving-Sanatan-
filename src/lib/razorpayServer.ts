import crypto from "crypto";

/**
 * Minimal Razorpay server client (no SDK) so every payment check happens on OUR server.
 * RAZORPAY_API_BASE exists only so automated tests can point at a fake Razorpay.
 */
const API = (process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1").replace(/\/+$/, "");

export function razorpayKeys(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  return keyId && keySecret ? { keyId, keySecret } : null;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const keys = razorpayKeys();
  if (!keys) throw new Error("Razorpay credentials are missing in environment variables");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: "Basic " + Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.description || `Razorpay error (${res.status})`);
  return json as T;
}

export interface RzpOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
  notes?: Record<string, string> | unknown[];
}

export const createRzpOrder = (o: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) =>
  call<RzpOrder>("POST", "/orders", {
    amount: o.amountPaise,
    currency: (o.currency || "INR").toUpperCase(),
    receipt: o.receipt,
    notes: o.notes || {},
  });

export const fetchRzpOrder = (id: string) => call<RzpOrder>("GET", `/orders/${encodeURIComponent(id)}`);

/** Constant-time check of the signature Razorpay's checkout returns after a payment. */
export function validPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = razorpayKeys()?.keySecret;
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export const orderNote = (o: RzpOrder, key: string): string =>
  o.notes && !Array.isArray(o.notes) ? String((o.notes as Record<string, string>)[key] ?? "") : "";
