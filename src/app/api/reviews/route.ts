import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { Review } from "@/types/database";

function mapReviewToCamelCase(r: any): Review {
  return {
    id: r.id,
    serviceId: r.service_id || "",
    serviceName: r.service_name || "General Session",
    practitionerId: r.practitioner_id || "",
    practitionerName: r.practitioner_name || "Unassigned",
    clientName: r.client_name,
    rating: Number(r.rating),
    comment: r.comment,
    date: r.date,
  };
}

/**
 * GET Handler - Retrieves reviews with filters from Supabase
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let query = supabaseServer.from("reviews").select("*");
    
    const practitionerId = searchParams.get("practitionerId");
    if (practitionerId) {
      query = query.eq("practitioner_id", practitionerId);
    }
    
    const serviceId = searchParams.get("serviceId");
    if (serviceId) {
      query = query.eq("service_id", serviceId);
    }
    
    const { data: reviews, error } = await query.order("date", { ascending: false });
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const mapped = (reviews || []).map(mapReviewToCamelCase);
    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read reviews database" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new review in Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, serviceName, practitionerId, practitionerName, clientName, rating, comment } = body;
    
    if (!clientName || !rating || !comment) {
      return NextResponse.json({ success: false, error: "Missing required review fields" }, { status: 400 });
    }
    
    const newReviewDb = {
      id: `rv-${Math.random().toString(36).substring(2, 9)}`,
      service_id: serviceId || "",
      service_name: serviceName || "General Session",
      practitioner_id: practitionerId || "",
      practitioner_name: practitionerName || "Unassigned",
      client_name: clientName,
      rating: Number(rating),
      comment,
      date: new Date().toISOString(),
    };
    
    const { data, error } = await supabaseServer
      .from("reviews")
      .insert([newReviewDb])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Recalculate practitioner ratings if assigned
    if (practitionerId) {
      const { data: practitioner, error: pracError } = await supabaseServer
        .from("practitioners")
        .select("rating, reviews_count")
        .eq("id", practitionerId)
        .single();
        
      if (!pracError && practitioner) {
        const ratingVal = Number(practitioner.rating || 5.0);
        const reviewsCount = Number(practitioner.reviews_count || 0);
        
        const newCount = reviewsCount + 1;
        const newRating = Number(((ratingVal * reviewsCount + Number(rating)) / newCount).toFixed(1));
        
        await supabaseServer
          .from("practitioners")
          .update({
            reviews_count: newCount,
            rating: newRating
          })
          .eq("id", practitionerId);
      }
    }
    
    return NextResponse.json({ success: true, data: mapReviewToCamelCase(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to post review feedback" }, { status: 500 });
  }
}

