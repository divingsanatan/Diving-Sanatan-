import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

// GET /api/seo/dashboard/runs — return the 20 most recent agent_runs
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("agent_runs")
      .select("id, agent_name, status, started_at, completed_at, items_processed, run_summary, error_message")
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
