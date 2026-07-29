import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { applyApprovedChange } from "@/lib/seo/implementationAgent";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "pending";

    const { data: changes, error } = await supabaseServer
      .from("pending_changes")
      .select("*")
      .eq("status", statusFilter)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: changes || [] });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { changeId, action, rejectionReason, approvedBy = "admin" } = body;

    if (!changeId || !action) {
      return NextResponse.json({ success: false, error: "changeId and action ('approve'|'reject') are required." }, { status: 400 });
    }

    if (action === "approve") {
      const result = await applyApprovedChange(changeId, approvedBy);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: result });
    } else if (action === "reject") {
      const { error } = await supabaseServer
        .from("pending_changes")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || "Rejected by administrator",
          approved_by: approvedBy
        })
        .eq("id", changeId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Change ${changeId} rejected.` });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
