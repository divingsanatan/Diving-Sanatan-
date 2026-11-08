import { NextRequest, NextResponse } from "next/server";
import { runMonitoringAgent } from "@/lib/seo/agents/monitoringAgent";
import { requireStaff } from "@/utils/authSession";

export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
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

export async function GET(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ message: "Monitoring & Reporting Agent endpoint active. Send POST request to trigger run." });
}
