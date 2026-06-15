import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { Practitioner } from "@/types/database";

function mapPractitionerToCamelCase(p: any): Practitioner {
  return {
    id: p.id,
    name: p.name,
    specialty: p.specialty,
    bio: p.bio,
    rating: Number(p.rating),
    reviewsCount: p.reviews_count,
    image: p.image || "elara_vance",
    video_url: p.video_url || "",
    certifications: p.certifications || [],
    expertise: p.expertise || [],
  };
}

/**
 * GET Handler - Retrieves practitioners from Supabase (or single practitioner if id parameter is provided)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const { data: p, error } = await supabaseServer
        .from("practitioners")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(p) });
    }

    const { data: practitioners, error } = await supabaseServer
      .from("practitioners")
      .select("*")
      .order("name", { ascending: true });
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const mapped = (practitioners || []).map(mapPractitionerToCamelCase);
    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read practitioners" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new practitioner (Admin restricted)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, specialty, bio, image, video_url, certifications, expertise } = body;
    
    if (!name || !specialty || !bio) {
      return NextResponse.json({ success: false, error: "Missing required practitioner fields" }, { status: 400 });
    }
    
    const newPracDb = {
      id: `prac-${Math.random().toString(36).substring(2, 9)}`,
      name,
      specialty,
      bio,
      rating: 5.0, // Initial perfect score
      reviews_count: 0,
      image: image || "elara_vance", // Default or uploaded image
      video_url: video_url || "",
      certifications: certifications || [],
      expertise: expertise || [],
    };
    
    const { data, error } = await supabaseServer
      .from("practitioners")
      .insert([newPracDb])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create practitioner" }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates practitioner info
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, specialty, bio, image, video_url, certifications, expertise } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Practitioner ID is required" }, { status: 400 });
    }
    
    const updates: any = {};
    if (name) updates.name = name;
    if (specialty) updates.specialty = specialty;
    if (bio) updates.bio = bio;
    if (image !== undefined) updates.image = image;
    if (video_url !== undefined) updates.video_url = video_url;
    if (certifications !== undefined) updates.certifications = certifications;
    if (expertise !== undefined) updates.expertise = expertise;
    
    const { data, error } = await supabaseServer
      .from("practitioners")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: mapPractitionerToCamelCase(data) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update practitioner" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes a practitioner
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Practitioner ID is required" }, { status: 400 });
    }
    
    const { error } = await supabaseServer
      .from("practitioners")
      .delete()
      .eq("id", id);
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: "Practitioner removed successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to remove practitioner" }, { status: 500 });
  }
}
