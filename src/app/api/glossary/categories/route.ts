import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

function mapGlossaryCategory(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string | undefined,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("glossary_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapGlossaryCategory),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read glossary categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const id = `gcat-${Math.random().toString(36).substring(2, 9)}`;
    const row = {
      id,
      name: name.trim(),
    };

    const { data, error } = await supabaseServer
      .from("glossary_categories")
      .insert([row])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapGlossaryCategory(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create glossary category" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ success: false, error: "Category ID and name are required" }, { status: 400 });
    }

    // 1. Get the old category name
    const { data: oldCategory, error: fetchError } = await supabaseServer
      .from("glossary_categories")
      .select("name")
      .eq("id", id)
      .single();

    if (fetchError || !oldCategory) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const oldName = oldCategory.name;
    const newName = name.trim();

    // 2. Update category in database
    const { data, error } = await supabaseServer
      .from("glossary_categories")
      .update({ name: newName })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 3. Cascade update glossary terms
    if (oldName !== newName) {
      await supabaseServer
        .from("glossary_terms")
        .update({ category: newName })
        .eq("category", oldName);
    }

    return NextResponse.json({ success: true, data: mapGlossaryCategory(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update glossary category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    // 1. Get the category name to delete
    const { data: category, error: fetchError } = await supabaseServer
      .from("glossary_categories")
      .select("name")
      .eq("id", id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    const catName = category.name;

    // 2. Delete the category
    const { error } = await supabaseServer
      .from("glossary_categories")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 3. Unlink matching glossary terms
    await supabaseServer
      .from("glossary_terms")
      .update({ category: "" })
      .eq("category", catName);

    return NextResponse.json({ success: true, message: "Category removed successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete glossary category" }, { status: 500 });
  }
}
