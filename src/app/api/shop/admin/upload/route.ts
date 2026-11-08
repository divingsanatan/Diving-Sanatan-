import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireStaff } from "@/utils/authSession";
import { sniffMedia } from "@/utils/fileSniff";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "uploads";

/** Admin-only image upload (JPEG, PNG, WebP, GIF, AVIF up to 5 MB). */
export async function POST(req: NextRequest) {
  const auth = requireStaff(req);
  if (!auth.ok) return auth.response;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "Image is larger than 5 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = sniffMedia(buffer);
    if (!kind || kind.kind !== "image") {
      return NextResponse.json({ success: false, error: "Only JPEG, PNG, WebP, GIF or AVIF images are allowed." }, { status: 415 });
    }

    const filename = `shop/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${kind.ext}`;
    let { error } = await supabaseServer.storage.from(BUCKET).upload(filename, buffer, { contentType: kind.mime, upsert: false });

    if (error && /bucket/i.test(error.message) && /not found/i.test(error.message)) {
      await supabaseServer.storage.createBucket(BUCKET, { public: true });
      ({ error } = await supabaseServer.storage.from(BUCKET).upload(filename, buffer, { contentType: kind.mime, upsert: false }));
    }
    if (error) {
      console.error("shop upload:", error.message);
      return NextResponse.json({ success: false, error: "Upload failed." }, { status: 500 });
    }

    const { data } = supabaseServer.storage.from(BUCKET).getPublicUrl(filename);
    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (e) {
    console.error("shop upload error:", e);
    return NextResponse.json({ success: false, error: "Upload failed." }, { status: 500 });
  }
}
