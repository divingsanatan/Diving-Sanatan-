import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getDb } from "@/utils/db";

// GET /api/seo/dashboard/runs — return the 20 most recent agent_runs
export async function GET() {
  try {
    let runs: any[] = [];

    try {
      const { data, error } = await supabaseServer
        .from("agent_runs")
        .select("id, agent_name, status, started_at, completed_at, items_processed, run_summary, error_message")
        .order("started_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        runs = data;
      }
    } catch (err) {
      console.warn("Supabase agent_runs GET failed, using db.json fallback:", err);
    }

    if (!runs || runs.length === 0) {
      try {
        const db = getDb();
        runs = db.agent_runs || [];
      } catch (dbErr) {
        console.error("Local db fetch error for agent_runs:", dbErr);
      }
    }

    return NextResponse.json({ success: true, data: runs || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
