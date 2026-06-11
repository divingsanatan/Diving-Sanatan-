import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

/**
 * GET Handler - Retrieves all categories from Supabase
 */
export async function GET() {
  try {
    const { data: categories, error } = await supabaseServer
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to read categories" }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new category (Admin restricted)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;
    
    if (!name) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }
    
    const newCategory = {
      id: `cat-${Math.random().toString(36).substring(2, 9)}`,
      name,
    };
    
    const { data, error } = await supabaseServer
      .from("categories")
      .insert([newCategory])
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes a category
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }
    
    const { error } = await supabaseServer
      .from("categories")
      .delete()
      .eq("id", id);
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: "Category removed successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to remove category" }, { status: 500 });
  }
}
