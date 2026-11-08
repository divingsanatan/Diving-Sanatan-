import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { buildQuote, newOrderNumber } from "@/lib/shopCommerce";
import { createRzpOrder, razorpayKeys } from "@/lib/razorpayServer";
import { sendAdminShopOrderNotification } from "@/utils/email";
import { allow, clientIp } from "@/utils/rateLimit";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Creates an order. The cart is re-priced from the database, so a customer can never
 * change what they pay. With Razorpay configured the order is returned ready to pay;
 * otherwise it is saved as a "manual payment" order for you to follow up.
 */
export async function POST(req: NextRequest) {
  if (!allow(`shop-checkout:${clientIp(req)}`, 12, 60 * 60 * 1000)) {
    return NextResponse.json({ success: false, error: "Too many orders from this connection. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const c = (body.customer || {}) as Record<string, unknown>;
  const a = (body.shipping || {}) as Record<string, unknown>;

  const customer = { name: clean(c.name, 100), email: clean(c.email, 200).toLowerCase(), phone: clean(c.phone, 20) };
  const ship = {
    address: clean(a.address, 300),
    city: clean(a.city, 80),
    state: clean(a.state, 80),
    pincode: clean(a.pincode, 12),
    country: clean(a.country, 60) || "India",
  };

  const problems: string[] = [];
  if (customer.name.length < 2) problems.push("Please enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) problems.push("Please enter a valid email address.");
  if (!/^\+?[0-9][0-9\s-]{7,16}$/.test(customer.phone)) problems.push("Please enter a valid phone number.");
  if (ship.address.length < 5) problems.push("Please enter your full address.");
  if (!ship.city) problems.push("Please enter your city.");
  if (!ship.state) problems.push("Please enter your state.");
  if (ship.country.toLowerCase() === "india" ? !/^[0-9]{6}$/.test(ship.pincode) : ship.pincode.length < 3) {
    problems.push("Please enter a valid PIN / postal code.");
  }
  if (problems.length) return NextResponse.json({ success: false, error: problems.join(" ") }, { status: 400 });

  const result = await buildQuote(body.items);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  const { quote } = result;
  if (quote.problems.length) {
    return NextResponse.json(
      { success: false, error: `${quote.problems.join(" ")} Please review your cart and try again.`, quote },
      { status: 409 }
    );
  }

  const keys = razorpayKeys();
  const orderNumber = newOrderNumber();
  const lines = quote.lines.map((l) => ({ productId: l.productId, name: l.name, slug: l.slug, sku: l.sku, image: l.image, price: l.price, qty: l.qty, lineTotal: l.lineTotal }));

  const { data: order, error } = await supabaseServer
    .from("shop_orders")
    .insert({
      order_number: orderNumber,
      status: "pending_payment",
      payment_method: keys ? "razorpay" : "manual",
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: ship.address,
      shipping_city: ship.city,
      shipping_state: ship.state,
      shipping_pincode: ship.pincode,
      shipping_country: ship.country,
      items: lines,
      subtotal: quote.subtotal,
      shipping_fee: quote.shippingFee,
      total: quote.total,
      currency: quote.currency,
      customer_notes: clean(body.notes, 500),
    })
    .select("id, order_number")
    .single();

  if (error || !order) {
    console.error("shop checkout insert:", error?.message);
    return NextResponse.json({ success: false, error: "We could not place your order. Please try again." }, { status: 500 });
  }

  const notify = () =>
    sendAdminShopOrderNotification({
      orderNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      address: `${ship.address}, ${ship.city}, ${ship.state} ${ship.pincode}, ${ship.country}`,
      items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      total: quote.total,
      paid: false,
      notes: clean(body.notes, 500),
    }).catch(() => undefined);

  // No online payment set up: the order is saved and the owner follows up.
  if (!keys) {
    await notify();
    return NextResponse.json({ success: true, mode: "manual", orderId: order.id, orderNumber });
  }

  try {
    const rzp = await createRzpOrder({
      amountPaise: Math.round(quote.total * 100),
      currency: quote.currency,
      receipt: orderNumber,
      notes: { shopOrderId: order.id, orderNumber },
    });
    await supabaseServer.from("shop_orders").update({ razorpay_order_id: rzp.id }).eq("id", order.id);
    return NextResponse.json({
      success: true,
      mode: "razorpay",
      orderId: order.id,
      orderNumber,
      razorpay: { orderId: rzp.id, amount: rzp.amount, currency: rzp.currency, keyId: keys.keyId },
    });
  } catch (e) {
    console.error("shop checkout razorpay:", e instanceof Error ? e.message : e);
    await supabaseServer.from("shop_orders").update({ status: "cancelled", admin_notes: "Payment could not be started." }).eq("id", order.id);
    return NextResponse.json({ success: false, error: "We could not start the payment. Please try again." }, { status: 502 });
  }
}
