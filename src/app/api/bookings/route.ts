import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { Booking } from "@/types/database";

function mapBookingToCamelCase(b: any): Booking {
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
    paymentStatus: b.payment_status,
  };
}

/**
 * GET Handler - Retrieves bookings from Supabase (optional email filter, otherwise lists all)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    
    let query = supabaseServer.from("bookings").select("*");
    
    if (email) {
      query = query.ilike("client_email", email.toLowerCase());
    }
    
    const { data: bookings, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const mappedBookings = (bookings || []).map(mapBookingToCamelCase);
    return NextResponse.json({ success: true, data: mappedBookings });
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
      serviceId, serviceName, practitionerId, practitionerName,
      date, timeSlot, price, clientName, clientEmail, clientPhone, notes 
    } = body;
    
    if (!serviceId || !serviceName || !practitionerId || !practitionerName || !date || !timeSlot || (price === undefined || price === null) || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json({ success: false, error: "Missing required booking details" }, { status: 400 });
    }
    
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
    
    return NextResponse.json({ success: true, data: mapBookingToCamelCase(data) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update booking status" }, { status: 500 });
  }
}

