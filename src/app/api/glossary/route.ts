import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { GlossaryTerm } from "@/types/database";

function mapGlossaryTerm(row: Record<string, unknown>): GlossaryTerm {
  const illustration = row.illustration as string | null;
  return {
    id: row.id as string,
    word: row.word as string,
    phonetic: (row.phonetic as string) || "",
    category: (row.category as string) || "",
    definition: row.definition as string,
    illustration:
      illustration === "aura-chart" || illustration === "chakra-system"
        ? illustration
        : null,
    createdAt: row.created_at as string | undefined,
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("glossary_terms")
      .select("*")
      .order("word", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapGlossaryTerm),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read glossary terms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word, phonetic, category, definition, illustration } = body;

    if (!word?.trim() || !definition?.trim()) {
      return NextResponse.json(
        { success: false, error: "Word and definition are required" },
        { status: 400 }
      );
    }

    const id = `gloss-${Math.random().toString(36).substring(2, 9)}`;
    const row = {
      id,
      word: word.trim(),
      phonetic: phonetic?.trim() || "",
      category: category?.trim() || "",
      definition: definition.trim(),
      illustration: illustration || null,
    };

    const { data, error } = await supabaseServer
      .from("glossary_terms")
      .insert([row])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapGlossaryTerm(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create glossary term" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, word, phonetic, category, definition, illustration } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Term ID is required" }, { status: 400 });
    }
    if (!word?.trim() || !definition?.trim()) {
      return NextResponse.json(
        { success: false, error: "Word and definition are required" },
        { status: 400 }
      );
    }

    const updates = {
      word: word.trim(),
      phonetic: phonetic?.trim() || "",
      category: category?.trim() || "",
      definition: definition.trim(),
      illustration: illustration || null,
    };

    const { data, error } = await supabaseServer
      .from("glossary_terms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapGlossaryTerm(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update glossary term" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Term ID is required" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("glossary_terms").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Glossary term removed successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete glossary term" }, { status: 500 });
  }
}
