import { NextRequest, NextResponse } from "next/server";
import { runTechnicalSeoAgent } from "@/lib/seo/agents/technicalSeoAgent";
import { supabaseServer } from "@/utils/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    let targetUrl = url || "https://divingsanatan.online/";
    let pageContent = "<h1>Diving Sanatan Sanctuary</h1><p>Spiritual Energy Healing, Chakra Balancing, Sound Therapy in Bhopal.</p>";

    // Fetch sample page content if available
    try {
      const { data: sampleBlog } = await supabaseServer
        .from("blogs")
        .select("title, content")
        .limit(1)
        .single();
      if (sampleBlog) {
        pageContent = `<h1>${sampleBlog.title}</h1>\n<p>${sampleBlog.content}</p>`;
      }
    } catch (e) {
      // ignore
    }

    const result = await runTechnicalSeoAgent(targetUrl, pageContent);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
