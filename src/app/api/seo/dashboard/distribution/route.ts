import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

// GET /api/seo/dashboard/distribution — return the 20 most recent distribution_log entries
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("distribution_log")
      .select("id, target, status, pushed_at, response_summary")
      .order("pushed_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
