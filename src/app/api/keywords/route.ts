import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { Keyword } from "@/types/database";

// Helper to map Supabase database objects to Keyword models
function mapKeywordRelations(k: any): Keyword {
  const categories = (k.keyword_categories || [])
    .map((kc: any) => kc.categories?.name)
    .filter(Boolean) as string[];
  const categoryIds = (k.keyword_categories || [])
    .map((kc: any) => kc.categories?.id)
    .filter(Boolean) as string[];
  const chakras = (k.keyword_chakras || [])
    .map((kc: any) => kc.chakra)
    .filter(Boolean) as string[];

  return {
    id: k.id,
    word: k.word,
    categories,
    categoryIds,
    chakras,
    createdAt: k.created_at,
    customCss: k.custom_css || "",
    publishDate: k.publish_date || ""
  };
}

/**
 * GET Handler - Retrieves keywords with categories and chakras
 */
export async function GET(req: NextRequest) {
  try {
    const { data: keywords, error } = await supabaseServer
      .from("keywords")
      .select(`
        *,
        keyword_categories (
          categories (
            id,
            name
          )
        ),
        keyword_chakras (
          chakra
        )
      `)
      .order("word", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const mapped = (keywords || []).map(mapKeywordRelations);
    return NextResponse.json({ success: true, data: mapped });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST Handler - Creates a new keyword and maps relations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { word, categoryIds, chakras, customCss, publishDate } = body;

    if (!word || !word.trim()) {
      return NextResponse.json({ success: false, error: "Keyword string is required" }, { status: 400 });
    }

    // Auto-schedule queue logic: if no publishDate is provided, schedule it 1 day after the latest scheduled keyword
    let finalPublishDate = publishDate;
    if (!finalPublishDate) {
      try {
        const { data: maxDateData } = await supabaseServer
          .from("keywords")
          .select("publish_date")
          .not("publish_date", "is", null)
          .order("publish_date", { ascending: false })
          .limit(1);

        if (maxDateData && maxDateData.length > 0 && maxDateData[0].publish_date) {
          const latestDate = new Date(maxDateData[0].publish_date);
          latestDate.setDate(latestDate.getDate() + 1);
          finalPublishDate = latestDate.toISOString();
        } else {
          finalPublishDate = new Date().toISOString();
        }
      } catch (err) {
        console.error("Auto-schedule failed:", err);
        finalPublishDate = new Date().toISOString();
      }
    }

    const keywordId = `key-${Math.random().toString(36).substring(2, 9)}`;

    const row = {
      id: keywordId,
      word: word.trim().toLowerCase(),
      custom_css: customCss || null,
      publish_date: finalPublishDate || null
    };

    // 1. Insert keyword row
    const { error: keyError } = await supabaseServer
      .from("keywords")
      .insert([row]);

    if (keyError) {
      return NextResponse.json({ success: false, error: keyError.message }, { status: 500 });
    }

    // 2. Insert Category M2M associations
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const catRelations = categoryIds.map((catId: string) => ({
        keyword_id: keywordId,
        category_id: catId
      }));
      const { error: catRelErr } = await supabaseServer
        .from("keyword_categories")
        .insert(catRelations);
      if (catRelErr) {
        console.error("Failed to seed keyword categories links:", catRelErr.message);
      }
    }

    // 3. Insert Chakra M2M associations
    if (chakras && Array.isArray(chakras) && chakras.length > 0) {
      const chakraRelations = chakras.map((chakraName: string) => ({
        keyword_id: keywordId,
        chakra: chakraName
      }));
      const { error: chkRelErr } = await supabaseServer
        .from("keyword_chakras")
        .insert(chakraRelations);
      if (chkRelErr) {
        console.error("Failed to seed keyword chakras links:", chkRelErr.message);
      }
    }

    return NextResponse.json({ success: true, message: "Keyword created successfully", data: { id: keywordId } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT Handler - Updates a keyword and resets relations
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, word, categoryIds, chakras, customCss, publishDate } = body;

    if (!id || !word || !word.trim()) {
      return NextResponse.json({ success: false, error: "ID and keyword string are required" }, { status: 400 });
    }

    const updates = {
      word: word.trim().toLowerCase(),
      custom_css: customCss || null,
      publish_date: publishDate || null
    };

    // 1. Update keyword row
    const { error: updateErr } = await supabaseServer
      .from("keywords")
      .update(updates)
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // 2. Reset Categories M2M and re-insert
    if (categoryIds && Array.isArray(categoryIds)) {
      await supabaseServer.from("keyword_categories").delete().eq("keyword_id", id);
      if (categoryIds.length > 0) {
        const catRelations = categoryIds.map((catId: string) => ({
          keyword_id: id,
          category_id: catId
        }));
        await supabaseServer.from("keyword_categories").insert(catRelations);
      }
    }

    // 3. Reset Chakras M2M and re-insert
    if (chakras && Array.isArray(chakras)) {
      await supabaseServer.from("keyword_chakras").delete().eq("keyword_id", id);
      if (chakras.length > 0) {
        const chakraRelations = chakras.map((chakraName: string) => ({
          keyword_id: id,
          chakra: chakraName
        }));
        await supabaseServer.from("keyword_chakras").insert(chakraRelations);
      }
    }

    return NextResponse.json({ success: true, message: "Keyword updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE Handler - Removes keyword
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Keyword ID is required" }, { status: 400 });
    }

    const ids = id.split(",");

    const { error } = await supabaseServer
      .from("keywords")
      .delete()
      .in("id", ids);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Keyword deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
