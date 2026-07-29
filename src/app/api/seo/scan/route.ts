import { NextRequest, NextResponse } from "next/server";
import { runSiteScanPipeline } from "@/lib/seo/agents/changeDetectionAgent";

export async function POST(req: NextRequest) {
  try {
    const result = await runSiteScanPipeline();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to execute Scan Website action" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Manual Scan Website Action Endpoint. Send a POST request to trigger site-wide change detection & agent review."
  });
}
