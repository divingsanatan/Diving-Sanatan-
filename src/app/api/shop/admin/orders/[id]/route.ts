import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireStaff } from "@/utils/authSession";
import { ORDER_STATUSES, mapOrderRow } from "@/lib/shopOrdersShared";
import { adjustStock } from "@/lib/shopCommerce";
import { revalidateShop } from "@/lib/shopRevalidate";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOLD = ["paid", "processing", "shipped", "delivered"];
const RETURNED = ["cancelled", "refunded"];

/** Update an order's status, tracking details and private notes. Stock follows the status. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: "Invalid order id." }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const status = typeof b.status === "string" ? b.status : undefined;
  if (status !== undefined && !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
  }

  const { data: existing } = await supabaseServer.from("shop_orders").select("*").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) patch.status = status;
  if (typeof b.trackingInfo === "string") patch.tracking_info = b.trackingInfo.slice(0, 500);
  if (typeof b.adminNotes === "string") patch.admin_notes = b.adminNotes.slice(0, 2000);

  const order = mapOrderRow(existing);
  if (status && SOLD.includes(status) && !existing.stock_adjusted) {
    await adjustStock(order.items, "down");
    patch.stock_adjusted = true;
  } else if (status && RETURNED.includes(status) && existing.stock_adjusted) {
    await adjustStock(order.items, "up");
    patch.stock_adjusted = false;
  }

  const { data, error } = await supabaseServer.from("shop_orders").update(patch).eq("id", id).select("*").single();
  if (error) {
    console.error("shop order update:", error.message);
    return NextResponse.json({ success: false, error: "Could not update the order." }, { status: 500 });
  }
  revalidateShop(order.items.map((i) => i.slug));
  return NextResponse.json({ success: true, data: mapOrderRow(data) });
}
