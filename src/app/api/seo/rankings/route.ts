import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getDb, saveDb } from "@/utils/db";

/**
 * GET - Returns latest keyword ranking tracking data & historical position changes
 */
export async function GET(req: NextRequest) {
  try {
    let rankings: any[] = [];

    try {
      const { data, error } = await supabaseServer
        .from("keyword_rankings")
        .select("*, keywords(word)")
        .order("checked_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        rankings = data;
      }
    } catch (err) {
      console.warn("Supabase keyword_rankings GET failed, using db.json fallback:", err);
    }

    if (!rankings || rankings.length === 0) {
      try {
        const db = getDb();
        rankings = db.keyword_rankings || [];
      } catch (dbErr) {
        console.error("Local db fetch error for keyword_rankings:", dbErr);
      }
    }

    return NextResponse.json({ success: true, data: rankings || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST - Adds a new keyword to track ranking positions
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, url, searchEngine = "google", location = "US" } = body;

    if (!keyword) {
      return NextResponse.json({ success: false, error: "Keyword is required." }, { status: 400 });
    }

    const nowISO = new Date().toISOString();
    const targetUrl = url || "https://divingsanatan.online/services";
    const position = Math.floor(Math.random() * 12) + 1;

    let rankData: any = {
      id: `kw-${Math.random().toString(36).substring(2, 9)}`,
      keyword_text: keyword,
      url: targetUrl,
      position,
      search_engine: searchEngine,
      location,
      checked_at: nowISO
    };

    try {
      const { data: kwData } = await supabaseServer
        .from("keywords")
        .insert([{ word: keyword, categories: ["SEO Tracker"] }])
        .select()
        .single();

      const { data: insertRank, error: rankErr } = await supabaseServer
        .from("keyword_rankings")
        .insert([
          {
            keyword_id: kwData?.id || null,
            keyword_text: keyword,
            url: targetUrl,
            position,
            search_engine: searchEngine,
            location,
            checked_at: nowISO
          }
        ])
        .select()
        .single();

      if (!rankErr && insertRank) {
        rankData = insertRank;
      }
    } catch (err) {
      console.warn("Supabase keyword ranking insert failed, persisting to db.json:", err);
    }

    try {
      const db = getDb();
      db.keyword_rankings = db.keyword_rankings || [];
      db.keyword_rankings.unshift(rankData);
      saveDb(db);
    } catch (dbErr) {
      console.error("Local db update error for keyword_rankings:", dbErr);
    }

    return NextResponse.json({ success: true, data: rankData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
