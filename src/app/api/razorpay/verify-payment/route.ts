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

    // If bookingId is passed, update booking status in database and send admin notification email
    if (bookingId) {
      let bookingData: any = null;

      // 1. Update Supabase DB if record exists and fetch updated data
      const { data: supaData, error: supaErr } = await supabaseServer
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
        })
        .eq("id", bookingId)
        .select()
        .single();

      if (!supaErr && supaData) {
        bookingData = {
          id: supaData.id,
          serviceName: supaData.service_name,
          practitionerName: supaData.practitioner_name,
          date: supaData.date,
          timeSlot: supaData.time_slot,
          price: Number(supaData.price),
          clientName: supaData.client_name,
          clientEmail: supaData.client_email,
          clientPhone: supaData.client_phone,
          notes: supaData.notes || "",
          paymentId: razorpay_payment_id,
        };
      } else if (supaErr) {
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

            if (!bookingData) {
              const b = db.bookings[idx];
              bookingData = {
                id: b.id,
                serviceName: b.serviceName || b.service_name,
                practitionerName: b.practitionerName || b.practitioner_name,
                date: b.date,
                timeSlot: b.timeSlot || b.time_slot,
                price: Number(b.price),
                clientName: b.clientName || b.client_name,
                clientEmail: b.clientEmail || b.client_email,
                clientPhone: b.clientPhone || b.client_phone,
                notes: b.notes || "",
                paymentId: razorpay_payment_id,
              };
            }
          }
        }
      } catch (e) {
        console.warn("Local DB booking update fallback error:", e);
      }

      // 3. Send Admin Notification Email
      if (bookingData) {
        try {
          const { sendAdminBookingNotification } = require("@/utils/email");
          await sendAdminBookingNotification(bookingData);
        } catch (emailErr: any) {
          console.error("Admin booking notification email error:", emailErr?.message || emailErr);
        }
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
