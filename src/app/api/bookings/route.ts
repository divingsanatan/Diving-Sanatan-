import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { Booking } from "@/types/database";
import { PANEL_ROLES, getSession } from "@/utils/authSession";
import { allow, clientIp } from "@/utils/rateLimit";

function mapBookingToCamelCase(b: any): Booking {
  const rawPaymentStatus = b.payment_status || b.paymentStatus;
  const isPaid = rawPaymentStatus === "paid" || b.status === "confirmed";
  const paymentStatus = isPaid ? "paid" : (rawPaymentStatus || "unpaid");

  return {
    id: b.id,
    serviceId: b.service_id,
    serviceName: b.service_name,
    practitionerId: b.practitioner_id,
    practitionerName: b.practitioner_name,
    date: b.date,
    timeSlot: b.time_slot,
    price: Number(b.price),
    clientName: b.client_name,
    clientEmail: b.client_email,
    clientPhone: b.client_phone,
    notes: b.notes || "",
    status: b.status,
    paymentStatus: paymentStatus,
  };
}

/** What anyone may see: that a slot is taken. No names, contacts, prices or notes. */
function toPublicAvailability(b: Booking) {
  return {
    id: b.id,
    serviceId: b.serviceId,
    serviceName: b.serviceName,
    practitionerId: b.practitionerId,
    practitionerName: b.practitionerName,
    date: b.date,
    timeSlot: b.timeSlot,
    status: b.status,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const emailLower = email ? email.toLowerCase().trim() : null;

    // Who is asking? Panel users see everything; a member sees only their own bookings; everyone else sees availability only.
    const session = getSession(req);
    const isPanel = !!session && PANEL_ROLES.includes(session.role);
    const isOwner = !!session && !!emailLower && session.email === emailLower;
    if (emailLower && !isPanel && !isOwner) {
      return NextResponse.json({ success: false, error: "Please sign in to see your bookings." }, { status: 403 });
    }
    const fullAccess = isPanel || isOwner;

    let mappedBookings: Booking[] = [];

    // 1. Try fetching from Supabase
    try {
      let query = supabaseServer.from("bookings").select("*");
      if (emailLower) {
        query = query.ilike("client_email", emailLower);
      }
      const { data: bookings, error } = await query.order("created_at", { ascending: false });
      if (!error && bookings && bookings.length > 0) {
        mappedBookings = bookings.map(mapBookingToCamelCase);
      }
    } catch (sbErr) {
      console.warn("Supabase fetch bookings warning:", sbErr);
    }

    // 2. Fallback / Merge with local db.json bookings if needed
    try {
      const { getDb } = require("@/utils/db");
      const db = getDb();
      if (db && db.bookings && Array.isArray(db.bookings)) {
        let localBookings = db.bookings;
        if (emailLower) {
          localBookings = localBookings.filter(
            (b: any) => (b.clientEmail || b.client_email || "").toLowerCase() === emailLower
          );
        }
        localBookings.forEach((lb: any) => {
          const item: Booking = {
            id: lb.id,
            serviceId: lb.serviceId || lb.service_id,
            serviceName: lb.serviceName || lb.service_name,
            practitionerId: lb.practitionerId || lb.practitioner_id,
            practitionerName: lb.practitionerName || lb.practitioner_name,
            date: lb.date,
            timeSlot: lb.timeSlot || lb.time_slot,
            price: Number(lb.price),
            clientName: lb.clientName || lb.client_name,
            clientEmail: lb.clientEmail || lb.client_email,
            clientPhone: lb.clientPhone || lb.client_phone,
            notes: lb.notes || "",
            status: lb.status || "pending",
            paymentStatus: lb.paymentStatus || lb.payment_status || "unpaid",
          };
          if (!mappedBookings.some((b) => b.id === item.id)) {
            mappedBookings.push(item);
          }
        });
      }
    } catch (dbErr) {
      console.warn("Local DB fetch bookings warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      data: fullAccess ? mappedBookings : mappedBookings.map(toPublicAvailability),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read bookings database" }, { status: 500 });
  }
}

/**
 * POST Handler - Submits a new booking session to Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      serviceId, practitionerId, practitionerName,
      date, timeSlot, clientName, clientEmail, clientPhone, notes 
    } = body;

    if (!allow(`booking:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many booking requests. Please try again later." }, { status: 429 });
    }

    if (!serviceId || !practitionerId || !practitionerName || !date || !timeSlot || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json({ success: false, error: "Missing required booking details" }, { status: 400 });
    }

    // The service name and PRICE always come from your database, never from the browser.
    const { data: service } = await supabaseServer.from("services").select("id, name, price").eq("id", serviceId).maybeSingle();
    if (!service) {
      return NextResponse.json({ success: false, error: "That service is no longer available." }, { status: 400 });
    }
    const serviceName = service.name;
    const price = Number(service.price);
    
    const newBookingDb = {
      id: `bk-${Math.random().toString(36).substring(2, 9)}`,
      service_id: serviceId,
      service_name: serviceName,
      practitioner_id: practitionerId,
      practitioner_name: practitionerName,
      date,
      time_slot: timeSlot,
      price: Number(price),
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      notes: notes || "",
      status: "pending", // Default to pending approval
      payment_status: "unpaid", // Default to unpaid until checkout
    };
    
    const { data, error } = await supabaseServer
      .from("bookings")
      .insert([newBookingDb])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: mapBookingToCamelCase(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to schedule booking" }, { status: 500 });
  }
}

/**
 * PATCH Handler - Updates status or paymentStatus (Admin / checkout operations)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, paymentStatus } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Booking ID is required for updating" }, { status: 400 });
    }
    if (status !== undefined && !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid booking status." }, { status: 400 });
    }
    if (paymentStatus !== undefined && !["unpaid", "paid", "refunded"].includes(paymentStatus)) {
      return NextResponse.json({ success: false, error: "Invalid payment status." }, { status: 400 });
    }

    // Permissions: panel users may change anything. Everyone else may only
    //  (a) cancel their OWN booking while signed in, or
    //  (b) confirm a booking that costs nothing. Paid status can never be set from the browser.
    const session = getSession(req);
    if (!(session && PANEL_ROLES.includes(session.role))) {
      const { data: existing } = await supabaseServer
        .from("bookings")
        .select("id, price, client_email")
        .eq("id", id)
        .maybeSingle();
      if (!existing) return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });

      const ownsIt = !!session && String(existing.client_email || "").toLowerCase() === session.email;
      const cancelOwn = ownsIt && status === "cancelled" && paymentStatus === undefined;
      const freeConfirm = Number(existing.price) === 0 && (status === "confirmed" || paymentStatus === "paid");
      if (!cancelOwn && !freeConfirm) {
        return NextResponse.json({ success: false, error: "You do not have permission to change this booking." }, { status: 403 });
      }
    }
    
    const updates: any = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.payment_status = paymentStatus;
    
    const { data, error } = await supabaseServer
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const mapped = mapBookingToCamelCase(data);

    if (status === "confirmed" || paymentStatus === "paid") {
      try {
        const { sendAdminBookingNotification } = require("@/utils/email");
        await sendAdminBookingNotification({
          id: mapped.id,
          serviceName: mapped.serviceName,
          practitionerName: mapped.practitionerName,
          date: mapped.date,
          timeSlot: mapped.timeSlot,
          price: mapped.price,
          clientName: mapped.clientName,
          clientEmail: mapped.clientEmail,
          clientPhone: mapped.clientPhone,
          notes: mapped.notes,
        });
      } catch (emailErr: any) {
        console.warn("Failed to send admin notification on booking status update:", emailErr?.message);
      }
    }

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update booking status" }, { status: 500 });
  }
}

