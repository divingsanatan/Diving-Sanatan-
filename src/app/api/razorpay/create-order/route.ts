import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { createRzpOrder, razorpayKeys } from "@/lib/razorpayServer";
import { allow, clientIp } from "@/utils/rateLimit";

/**
 * Creates a Razorpay order. The AMOUNT IS ALWAYS CALCULATED HERE from your database
 * (the booking's saved price, or the selected services' prices). A price sent by the
 * browser is ignored, so it can no longer be tampered with.
 */
export async function POST(req: NextRequest) {
  try {
    if (!allow(`rzp-order:${clientIp(req)}`, 30, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many payment attempts. Please wait a few minutes." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const serviceIds: string[] = Array.isArray(body.serviceIds)
      ? Array.from(new Set(body.serviceIds.filter((x: unknown) => typeof x === "string" && x)))
      : [];
    const clientNotes = (body.notes && typeof body.notes === "object" ? body.notes : {}) as Record<string, unknown>;

    const keys = razorpayKeys();
    if (!keys) {
      return NextResponse.json({ success: false, error: "Online payments are not configured yet." }, { status: 500 });
    }

    let amount = 0;
    if (bookingId) {
      const { data: booking, error } = await supabaseServer
        .from("bookings")
        .select("id, price, payment_status, status")
        .eq("id", bookingId)
        .maybeSingle();
      if (error || !booking) return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
      if (booking.payment_status === "paid") {
        return NextResponse.json({ success: false, error: "This booking has already been paid." }, { status: 409 });
      }
      if (booking.status === "cancelled") {
        return NextResponse.json({ success: false, error: "This booking was cancelled." }, { status: 409 });
      }
      amount = Number(booking.price);
    } else if (serviceIds.length > 0 && serviceIds.length <= 20) {
      const { data: rows, error } = await supabaseServer.from("services").select("id, price").in("id", serviceIds);
      if (error || !rows || rows.length !== serviceIds.length) {
        return NextResponse.json({ success: false, error: "One of the selected services no longer exists." }, { status: 400 });
      }
      amount = rows.reduce((sum: number, r: { price: number }) => sum + Number(r.price), 0);
    } else {
      return NextResponse.json({ success: false, error: "Nothing to pay for." }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "There is nothing to pay for this booking." }, { status: 400 });
    }

    const clip = (v: unknown) => (typeof v === "string" ? v.slice(0, 100) : "");
    const order = await createRzpOrder({
      amountPaise: Math.round(amount * 100),
      currency: "INR",
      receipt: bookingId ? `rcpt_${bookingId}`.slice(0, 40) : `rcpt_${Date.now()}`,
      notes: {
        bookingId,
        customerName: clip(clientNotes.customerName),
        customerEmail: clip(clientNotes.customerEmail),
        customerPhone: clip(clientNotes.customerPhone),
      },
    });

    return NextResponse.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt },
      keyId: keys.keyId,
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json({ success: false, error: "Could not start the payment. Please try again." }, { status: 500 });
  }
}
