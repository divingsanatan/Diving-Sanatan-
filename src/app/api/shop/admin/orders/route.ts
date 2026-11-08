import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireStaff } from "@/utils/authSession";
import { mapOrderRow } from "@/lib/shopOrdersShared";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  const { data, error } = await supabaseServer
    .from("shop_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("shop orders list:", error.message);
    return NextResponse.json({ success: false, error: "Could not load orders." }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: (data || []).map(mapOrderRow) });
}
