import { NextResponse } from "next/server";
import { clearSession } from "@/utils/authSession";

/** Signs the visitor out by clearing the server-verified session cookie. */
export async function POST() {
  const res = NextResponse.json({ success: true });
  clearSession(res);
  return res;
}
