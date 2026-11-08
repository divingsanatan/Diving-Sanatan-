import { NextRequest, NextResponse } from "next/server";
import { runOffPageAgent } from "@/lib/seo/agents/offPageAgent";
import { requireStaff } from "@/utils/authSession";

export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  try {
    const result = await runOffPageAgent();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ message: "Off-page & Backlink Agent endpoint active." });
}
