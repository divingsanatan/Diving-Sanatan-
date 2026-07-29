import { NextRequest, NextResponse } from "next/server";
import { runAIVisibilityAgent } from "@/lib/seo/agents/aiVisibilityAgent";

export async function POST() {
  try {
    const result = await runAIVisibilityAgent();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "AI/GEO Visibility Agent endpoint active." });
}
