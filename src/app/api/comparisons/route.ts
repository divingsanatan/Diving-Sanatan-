import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { ComparisonPage } from "@/types/database";

function mapRow(db: Record<string, unknown>): ComparisonPage {
  return {
    id: db.id as string,
    slug: db.slug as string,
    title: db.title as string,
    subtitle: (db.subtitle as string) || "",
    modalityAName: (db.modality_a_name as string) || "",
    modalityAPrice: (db.modality_a_price as string) || "",
    modalityAServiceId: (db.modality_a_service_id as string) || undefined,
    modalityBName: (db.modality_b_name as string) || "",
    modalityBPrice: (db.modality_b_price as string) || "",
    modalityBServiceId: (db.modality_b_service_id as string) || undefined,
    rows: Array.isArray(db.rows) ? db.rows : [],
    media: Array.isArray(db.media) ? db.media : [],
    serviceIds: Array.isArray(db.service_ids) ? db.service_ids : [],
    createdAt: db.created_at as string | undefined,
  };
}

function toDbPayload(body: Record<string, unknown>) {
  return {
    slug: body.slug,
    title: body.title,
    subtitle: body.subtitle ?? "",
    modality_a_name: body.modalityAName ?? "",
    modality_a_price: body.modalityAPrice ?? "",
    modality_a_service_id: body.modalityAServiceId || null,
    modality_b_name: body.modalityBName ?? "",
    modality_b_price: body.modalityBPrice ?? "",
    modality_b_service_id: body.modalityBServiceId || null,
    rows: Array.isArray(body.rows) ? body.rows : [],
    media: Array.isArray(body.media) ? body.media : [],
    service_ids: Array.isArray(body.serviceIds) ? body.serviceIds : [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (id) {
      const { data, error } = await supabaseServer
        .from("comparison_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: "Comparison page not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: mapRow(data) });
    }

    if (slug) {
      const { data, error } = await supabaseServer
        .from("comparison_pages")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: "Comparison page not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: mapRow(data) });
    }

    const { data, error } = await supabaseServer
      .from("comparison_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: (data || []).map(mapRow) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read comparison pages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, error: "Title and slug are required" }, { status: 400 });
    }

    const newPage = {
      id: `cmp-${Math.random().toString(36).substring(2, 9)}`,
      ...toDbPayload(body),
    };

    const { data, error } = await supabaseServer
      .from("comparison_pages")
      .insert([newPage])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapRow(data) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create comparison page";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Comparison page ID is required" }, { status: 400 });
    }

    const updates = toDbPayload(body);

    const { data, error } = await supabaseServer
      .from("comparison_pages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapRow(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update comparison page";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Comparison page ID is required" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("comparison_pages")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Comparison page removed successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove comparison page";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
