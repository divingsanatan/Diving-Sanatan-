import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { FAQItem } from "@/types/database";
import { getOrSetServerCache, invalidateServerCache } from "@/utils/serverCache";

function mapFAQItem(row: Record<string, unknown>): FAQItem {
  return {
    id: row.id as string,
    question: row.question as string,
    answer: row.answer as string,
    verified: !!row.verified,
    isPublished: !!row.is_published,
    createdAt: row.created_at as string | undefined,
  };
}

export async function GET() {
  try {
    const data = await getOrSetServerCache("faqs_all_published", 60, async () => {
      const { data: dbData, error } = await supabaseServer
        .from("faqs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return (dbData || []).map(mapFAQItem);
    });

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to read FAQ items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, answer, verified, isPublished } = body;

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json(
        { success: false, error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const id = `faq-${Math.random().toString(36).substring(2, 9)}`;
    const row = {
      id,
      question: question.trim(),
      answer: answer.trim(),
      verified: verified !== undefined ? !!verified : true,
      is_published: isPublished !== undefined ? !!isPublished : true,
    };

    const { data, error } = await supabaseServer
      .from("faqs")
      .insert([row])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    invalidateServerCache("faqs_");
    return NextResponse.json({ success: true, data: mapFAQItem(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create FAQ item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, question, answer, verified, isPublished } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 });
    }
    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json(
        { success: false, error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const updates = {
      question: question.trim(),
      answer: answer.trim(),
      verified: !!verified,
      is_published: !!isPublished,
    };

    const { data, error } = await supabaseServer
      .from("faqs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    invalidateServerCache("faqs_");
    return NextResponse.json({ success: true, data: mapFAQItem(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update FAQ item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "FAQ ID is required" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("faqs").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    invalidateServerCache("faqs_");
    return NextResponse.json({ success: true, message: "FAQ item removed successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete FAQ item" }, { status: 500 });
  }
}

