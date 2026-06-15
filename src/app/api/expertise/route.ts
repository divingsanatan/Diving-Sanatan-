import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

/**
 * GET Handler - Retrieves all expertise options from Supabase
 */
export async function GET() {
  try {
    const { data: expertiseList, error } = await supabaseServer
      .from("expertise")
      .select("*")
      .order("name", { ascending: true });
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: expertiseList });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read expertise options" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new expertise option (Admin restricted)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json({ success: false, error: "Expertise name is required" }, { status: 400 });
    }
    
    const newExpertise = {
      id: `exp-${Math.random().toString(36).substring(2, 9)}`,
      name,
    };
    
    const { data, error } = await supabaseServer
      .from("expertise")
      .insert([newExpertise])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create expertise option" }, { status: 500 });
  }
}
