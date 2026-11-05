import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { requireAdmin } from "@/utils/adminToken";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "uploads";

/** Detects the real image type from the file's first bytes (not the claimed type). */
function sniffImage(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (buf.length > 6 && ["GIF87a", "GIF89a"].includes(buf.subarray(0, 6).toString("ascii"))) return { mime: "image/gif", ext: "gif" };
  if (buf.length > 12 && buf.subarray(4, 8).toString("ascii") === "ftyp" && ["avif", "avis"].includes(buf.subarray(8, 12).toString("ascii"))) return { mime: "image/avif", ext: "avif" };
  return null;
}

/** Admin-only image upload (JPEG, PNG, WebP, GIF, AVIF up to 5 MB). */
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
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
    const kind = sniffImage(buffer);
    if (!kind) {
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
