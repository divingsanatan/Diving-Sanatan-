import { supabaseServer } from "@/utils/supabaseServer";
import { mapProductRow } from "./shopShared";
import type { OrderLine } from "./shopOrdersShared";

/**
 * All shop money maths happens HERE, on the server, from the database.
 * Prices that arrive from the browser are never used.
 */

export interface Quote {
  lines: (OrderLine & { maxQty: number | null })[];
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  problems: string[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Flat shipping fee from settings (SHOP_SHIPPING_FEE), free above SHOP_FREE_SHIPPING_OVER. Default: free. */
export function shippingFor(subtotal: number): number {
  const flat = Number(process.env.SHOP_SHIPPING_FEE || 0);
  const freeOver = Number(process.env.SHOP_FREE_SHIPPING_OVER || 0);
  if (!(flat > 0)) return 0;
  if (freeOver > 0 && subtotal >= freeOver) return 0;
  return round2(flat);
}

export async function buildQuote(rawItems: unknown): Promise<{ ok: true; quote: Quote } | { ok: false; error: string }> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { ok: false, error: "Your cart is empty." };
  if (rawItems.length > 30) return { ok: false, error: "Your cart has too many items." };

  const wanted = new Map<string, number>();
  for (const it of rawItems) {
    const id = typeof it?.productId === "string" ? it.productId : "";
    const qty = Math.trunc(Number(it?.qty));
    if (!UUID.test(id) || !Number.isFinite(qty) || qty < 1) continue;
    wanted.set(id, Math.min(20, (wanted.get(id) || 0) + qty));
  }
  if (wanted.size === 0) return { ok: false, error: "Your cart is empty." };

  const { data, error } = await supabaseServer
    .from("shop_products")
    .select("*")
    .in("id", Array.from(wanted.keys()))
    .eq("status", "published");
  if (error) return { ok: false, error: "We could not load your cart. Please try again." };

  const problems: string[] = [];
  const found = new Map((data || []).map((r) => [r.id as string, mapProductRow(r)]));
  const lines: Quote["lines"] = [];

  for (const [id, askedQty] of wanted) {
    const p = found.get(id);
    if (!p) {
      problems.push("An item in your cart is no longer available and was removed.");
      continue;
    }
    if (p.price <= 0) {
      problems.push(`"${p.name}" cannot be bought online. Please enquire about it instead.`);
      continue;
    }
    if (p.stockStatus === "out_of_stock") {
      problems.push(`"${p.name}" is out of stock and was removed.`);
      continue;
    }
    let qty = askedQty;
    const cap = p.stockQuantity !== null ? p.stockQuantity : null;
    if (cap !== null && qty > cap) {
      if (cap <= 0) {
        problems.push(`"${p.name}" is out of stock and was removed.`);
        continue;
      }
      problems.push(`Only ${cap} of "${p.name}" ${cap === 1 ? "is" : "are"} available, so the quantity was reduced.`);
      qty = cap;
    }
    lines.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image: p.images[0]?.url || "",
      price: p.price,
      qty,
      lineTotal: round2(p.price * qty),
      maxQty: cap,
    });
    (lines[lines.length - 1] as { currency?: string }).currency = p.currency;
  }

  if (lines.length === 0) return { ok: false, error: problems[0] || "Your cart is empty." };

  const currencies = new Set(lines.map((l) => (l as unknown as { currency: string }).currency));
  if (currencies.size > 1) return { ok: false, error: "Items priced in different currencies cannot be bought together." };
  const currency = Array.from(currencies)[0] || "INR";
  for (const l of lines) delete (l as { currency?: string }).currency;

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const shippingFee = shippingFor(subtotal);
  return { ok: true, quote: { lines, subtotal, shippingFee, total: round2(subtotal + shippingFee), currency, problems } };
}

/** Moves stock down (sale) or back up (cancel/refund). Products with no tracked quantity are left alone. */
export async function adjustStock(lines: OrderLine[], direction: "down" | "up") {
  for (const l of lines) {
    const { data: row } = await supabaseServer
      .from("shop_products")
      .select("id, stock_quantity, stock_status")
      .eq("id", l.productId)
      .maybeSingle();
    if (!row || row.stock_quantity === null || row.stock_quantity === undefined) continue;
    const next = Math.max(0, Number(row.stock_quantity) + (direction === "down" ? -l.qty : l.qty));
    const patch: Record<string, unknown> = { stock_quantity: next, updated_at: new Date().toISOString() };
    if (direction === "down" && next === 0) patch.stock_status = "out_of_stock";
    if (direction === "up" && next > 0 && row.stock_status === "out_of_stock") patch.stock_status = "in_stock";
    await supabaseServer.from("shop_products").update(patch).eq("id", l.productId);
  }
}

export function newOrderNumber(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 5; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `DS-${ymd}-${tail}`;
}
