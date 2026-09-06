import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/utils/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay verification parameters" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: "Razorpay secret key is not configured" },
        { status: 500 }
      );
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: "Invalid Razorpay payment signature" },
        { status: 400 }
      );
    }

    // If bookingId is passed, update booking status in database
    if (bookingId) {
      // 1. Update Supabase DB if record exists
      const { error: supaErr } = await supabaseServer
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
        })
        .eq("id", bookingId);

      if (supaErr) {
        console.warn("Supabase booking status update warning:", supaErr.message);
      }

      // 2. Local db update fallback if available
      try {
        const { getDb, saveDb } = require("@/utils/db");
        const db = getDb();
        if (db && db.bookings) {
          const idx = db.bookings.findIndex((b: any) => b.id === bookingId);
          if (idx !== -1) {
            db.bookings[idx].status = "confirmed";
            db.bookings[idx].paymentStatus = "paid";
            db.bookings[idx].payment_status = "paid";
            saveDb(db);
          }
        }
      } catch (e) {
        console.warn("Local DB booking update fallback error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error: any) {
    console.error("Razorpay Verify Payment Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to verify Razorpay payment" },
      { status: 500 }
    );
  }
}
