import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ redirect: null });
    }

    const cleanPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;

    const { data: redirect, error } = await supabaseServer
      .from("redirects")
      .select("target_path, status_code")
      .or(`source_path.eq.${cleanPath},source_path.eq.${cleanPath}/`)
      .limit(1)
      .maybeSingle();

    if (error || !redirect) {
      return NextResponse.json({ redirect: null });
    }

    return NextResponse.json({
      redirect: {
        target_url: redirect.target_path,
        status_code: redirect.status_code || 301,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ redirect: null });
  }
}
