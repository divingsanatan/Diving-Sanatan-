import { NextResponse } from "next/server";
import { getSession } from "@/utils/authSession";

export const dynamic = "force-dynamic";

/** Who is signed in right now (according to the server-verified cookie)? Used by admin screens. */
export async function GET(req: Request) {
  const s = getSession(req);
  if (!s) return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ success: true, data: { id: s.id, role: s.role, email: s.email, name: s.name || "" } });
}
