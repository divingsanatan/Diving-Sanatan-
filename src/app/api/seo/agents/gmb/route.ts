import { NextRequest, NextResponse } from "next/server";
import { runGmbAgent } from "@/lib/seo/agents/gmbAgent";

export async function POST() {
  try {
    const result = await runGmbAgent();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Local/GMB Agent endpoint active." });
}
