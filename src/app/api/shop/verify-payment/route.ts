import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { fetchRzpOrder, orderNote, validPaymentSignature } from "@/lib/razorpayServer";
import { adjustStock } from "@/lib/shopCommerce";
import { revalidateShop } from "@/lib/shopRevalidate";
import { sendAdminShopOrderNotification } from "@/utils/email";
import { allow, clientIp } from "@/utils/rateLimit";
import { mapOrderRow } from "@/lib/shopOrdersShared";

export const dynamic = "force-dynamic";

/**
 * Confirms a shop payment. An order is marked paid only when ALL of these hold:
 *  - Razorpay's signature is valid for this order + payment
 *  - Razorpay's own record of the order belongs to OUR order and equals the saved total
 */
export async function POST(req: NextRequest) {
  if (!allow(`shop-verify:${clientIp(req)}`, 40, 15 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many attempts. Please wait." }, { status: 429 });
  }
  const b = await req.json().catch(() => ({}));
  const orderId = String(b.orderId || "");
  const rzpOrderId = String(b.razorpay_order_id || "");
  const paymentId = String(b.razorpay_payment_id || "");
  const signature = String(b.razorpay_signature || "");
  if (!orderId || !rzpOrderId || !paymentId || !signature) {
    return NextResponse.json({ success: false, error: "Missing payment details." }, { status: 400 });
  }

  const { data: row } = await supabaseServer.from("shop_orders").select("*").eq("id", orderId).maybeSingle();
  if (!row) return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
  if (row.razorpay_order_id !== rzpOrderId) {
    return NextResponse.json({ success: false, error: "This payment does not belong to this order." }, { status: 400 });
  }
  if (!validPaymentSignature(rzpOrderId, paymentId, signature)) {
    return NextResponse.json({ success: false, error: "Invalid payment signature." }, { status: 400 });
  }

  // Already confirmed (page refresh, double click): succeed quietly.
  if (row.status !== "pending_payment") {
    return NextResponse.json({ success: true, orderId, status: row.status });
  }

  let rzp;
  try {
    rzp = await fetchRzpOrder(rzpOrderId);
  } catch {
    return NextResponse.json({ success: false, error: "Could not confirm the payment with Razorpay." }, { status: 502 });
  }
  if (orderNote(rzp, "shopOrderId") !== orderId || Number(rzp.amount) !== Math.round(Number(row.total) * 100)) {
    return NextResponse.json({ success: false, error: "The payment does not match this order." }, { status: 400 });
  }

  const { data: updated, error } = await supabaseServer
    .from("shop_orders")
    .update({ status: "paid", razorpay_payment_id: paymentId, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ success: false, error: "Could not save the payment." }, { status: 500 });

  if (updated) {
    const order = mapOrderRow(updated);
    await adjustStock(order.items, "down");
    await supabaseServer.from("shop_orders").update({ stock_adjusted: true }).eq("id", orderId);
    revalidateShop(order.items.map((i) => i.slug));
    await sendAdminShopOrderNotification({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      address: `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} ${order.shippingPincode}, ${order.shippingCountry}`,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      total: order.total,
      paid: true,
      notes: order.customerNotes,
    }).catch(() => undefined);
  }
  return NextResponse.json({ success: true, orderId, status: "paid" });
}
