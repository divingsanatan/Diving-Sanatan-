import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { applyApprovedChange } from "@/lib/seo/implementationAgent";
import { getDb, saveDb } from "@/utils/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "pending";

    let changes: any[] = [];

    try {
      const { data, error } = await supabaseServer
        .from("pending_changes")
        .select("*")
        .eq("status", statusFilter)
        .order("created_at", { ascending: false });

      if (!error && data) {
        changes = data;
      }
    } catch (err) {
      console.warn("Supabase pending_changes GET failed, using db.json fallback:", err);
    }

    if (!changes || changes.length === 0) {
      try {
        const db = getDb();
        changes = (db.pending_changes || []).filter((c: any) => c.status === statusFilter);
      } catch (dbErr) {
        console.error("Local db fetch error for pending_changes:", dbErr);
      }
    }

    return NextResponse.json({ success: true, data: changes || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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
      try {
        await supabaseServer
          .from("pending_changes")
          .update({
            status: "rejected",
            rejection_reason: rejectionReason || "Rejected by administrator",
            approved_by: approvedBy
          })
          .eq("id", changeId);
      } catch (err) {
        console.warn("Supabase reject update failed:", err);
      }

      try {
        const db = getDb();
        if (db.pending_changes) {
          const idx = db.pending_changes.findIndex((c: any) => c.id === changeId);
          if (idx !== -1) {
            db.pending_changes[idx].status = "rejected";
            saveDb(db);
          }
        }
      } catch (dbErr) {
        console.error("Failed to update db.json on reject:", dbErr);
      }

      return NextResponse.json({ success: true, message: `Change ${changeId} rejected.` });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
