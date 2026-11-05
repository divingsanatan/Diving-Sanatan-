import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireAdmin } from "@/utils/adminToken";
import { parseProductInput } from "@/lib/shopServer";
import { revalidateShop } from "@/lib/shopRevalidate";
import { mapProductRow } from "@/lib/shopShared";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Update a product. If a published product's slug changes, a 301 redirect is created. */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: "Invalid product id." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = parseProductInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.errors.join(" ") }, { status: 400 });
  }

  const { data: existing, error: findErr } = await supabaseServer
    .from("shop_products")
    .select("id, slug, status")
    .eq("id", id)
    .maybeSingle();
  if (findErr) {
    console.error("shop admin find:", findErr.message);
    return NextResponse.json({ success: false, error: "Could not load the product." }, { status: 500 });
  }
  if (!existing) return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });

  const { data, error } = await supabaseServer
    .from("shop_products")
    .update({ ...parsed.row, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: false, error: "That URL slug is already used by another product." }, { status: 409 });
    }
    console.error("shop admin update:", error.message);
    return NextResponse.json({ success: false, error: "Could not save the product." }, { status: 500 });
  }

  const product = mapProductRow(data);
  const oldSlug: string = existing.slug;
  const slugChanged = oldSlug !== product.slug;

  if (slugChanged) {
    // Don't break links or lose ranking: send the old address to the new one.
    // Also clear any older redirect that would now point into a loop.
    await supabaseServer.from("redirects").delete().eq("source_path", `/shop/${product.slug}`);
    if (existing.status === "published") {
      const { error: redirErr } = await supabaseServer
        .from("redirects")
        .upsert(
          { source_path: `/shop/${oldSlug}`, target_path: `/shop/${product.slug}`, status_code: 301 },
          { onConflict: "source_path" }
        );
      if (redirErr) console.error("shop redirect create:", redirErr.message);
    }
  }

  revalidateShop([oldSlug, product.slug]);
  return NextResponse.json({ success: true, data: product, redirectCreated: slugChanged && existing.status === "published" });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ success: false, error: "Invalid product id." }, { status: 400 });

  const { data, error } = await supabaseServer.from("shop_products").delete().eq("id", id).select("slug").maybeSingle();
  if (error) {
    console.error("shop admin delete:", error.message);
    return NextResponse.json({ success: false, error: "Could not delete the product." }, { status: 500 });
  }
  revalidateShop(data?.slug ? [data.slug] : []);
  return NextResponse.json({ success: true });
}
