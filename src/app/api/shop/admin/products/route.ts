import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireStaff } from "@/utils/authSession";
import { parseProductInput } from "@/lib/shopServer";
import { revalidateShop } from "@/lib/shopRevalidate";
import { mapProductRow } from "@/lib/shopShared";

export const dynamic = "force-dynamic";

/** List every product (all statuses) for the admin screen. */
export async function GET(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseServer
    .from("shop_products")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("shop admin list:", error.message);
    return NextResponse.json({ success: false, error: "Could not load products." }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: (data || []).map(mapProductRow) });
}

/** Create a product. */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = parseProductInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });
  }

  const { data, error } = await supabaseServer.from("shop_products").insert(parsed.row).select("*").single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: false, error: "That URL slug is already used by another product." }, { status: 409 });
    }
    console.error("shop admin create:", error.message);
    return NextResponse.json({ success: false, error: "Could not save the product." }, { status: 500 });
  }

  const product = mapProductRow(data);
  revalidateShop([product.slug]);
  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
