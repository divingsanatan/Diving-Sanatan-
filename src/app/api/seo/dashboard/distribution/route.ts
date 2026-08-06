import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getDb } from "@/utils/db";

// GET /api/seo/dashboard/distribution — return the 20 most recent distribution_log entries
export async function GET() {
  try {
    let logs: any[] = [];

    try {
      const { data, error } = await supabaseServer
        .from("distribution_log")
        .select("id, target, status, pushed_at, response_summary")
        .order("pushed_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        logs = data;
      }
    } catch (err) {
      console.warn("Supabase distribution_log GET failed, using db.json fallback:", err);
    }

    if (!logs || logs.length === 0) {
      try {
        const db = getDb();
        logs = db.distribution_log || [];
      } catch (dbErr) {
        console.error("Local db fetch error for distribution_log:", dbErr);
      }
    }

    return NextResponse.json({ success: true, data: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
