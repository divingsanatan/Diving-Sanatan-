import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requirePanel } from "@/utils/authSession";
import { sniffMedia } from "@/utils/fileSniff";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 60 * 1024 * 1024;
const BUCKET = "uploads";

/**
 * Admin-panel uploads. Only signed-in panel users, and only real images or videos
 * (checked by content, not by file name). Everything else is refused.
 */
export async function POST(req: NextRequest) {
  const auth = requirePanel(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_VIDEO) {
      return NextResponse.json({ success: false, error: "File is too large." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = sniffMedia(buffer);
    if (!kind) {
      return NextResponse.json(
        { success: false, error: "Only images (JPG, PNG, WebP, GIF, AVIF) and videos (MP4, MOV, WebM) are allowed." },
        { status: 415 }
      );
    }
    if (kind.kind === "image" && buffer.length > MAX_IMAGE) {
      return NextResponse.json({ success: false, error: "Image is larger than 8 MB." }, { status: 413 });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${kind.ext}`;
    let { error } = await supabaseServer.storage.from(BUCKET).upload(filename, buffer, { contentType: kind.mime, upsert: false });
    if (error && /bucket/i.test(error.message) && /not found/i.test(error.message)) {
      await supabaseServer.storage.createBucket(BUCKET, { public: true });
      ({ error } = await supabaseServer.storage.from(BUCKET).upload(filename, buffer, { contentType: kind.mime, upsert: false }));
    }
    if (error) {
      console.error("Supabase Storage upload error:", error.message);
      return NextResponse.json({ success: false, error: "Upload failed." }, { status: 500 });
    }

    const { data } = supabaseServer.storage.from(BUCKET).getPublicUrl(filename);
    if (!data?.publicUrl) {
      return NextResponse.json({ success: false, error: "Failed to generate public URL" }, { status: 500 });
    }
    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed." }, { status: 500 });
  }
}
