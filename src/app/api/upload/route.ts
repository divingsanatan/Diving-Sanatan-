import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const bucketName = "uploads";
    
    // 1. Ensure the bucket exists or create it
    const { data: buckets, error: listError } = await supabaseServer.storage.listBuckets();
    if (listError) {
      console.error("Error listing buckets:", listError);
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    if (!bucketExists) {
      const { error: createError } = await supabaseServer.storage.createBucket(bucketName, {
        public: true,
      });
      if (createError) {
        console.error("Error creating bucket:", createError);
      }
    }
    
    // 2. Generate a unique filename to avoid overwrites
    const originalExt = path.extname(file.name) || ".bin";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${originalExt}`;
    
    // 3. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true
      });
      
    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }
    
    // 4. Get the public URL of the uploaded file
    const { data: urlData } = supabaseServer.storage
      .from(bucketName)
      .getPublicUrl(filename);
      
    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({ success: false, error: "Failed to generate public URL" }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl
    });
  } catch (error: any) {
    console.error("Supabase file upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

