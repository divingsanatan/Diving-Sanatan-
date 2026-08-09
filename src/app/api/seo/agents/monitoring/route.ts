import { NextRequest, NextResponse } from "next/server";
import { runMonitoringAgent } from "@/lib/seo/agents/monitoringAgent";

export async function POST(req: NextRequest) {
  try {
    const result = await runMonitoringAgent();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to execute Monitoring Agent" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Monitoring & Reporting Agent endpoint active. Send POST request to trigger run." });
}
