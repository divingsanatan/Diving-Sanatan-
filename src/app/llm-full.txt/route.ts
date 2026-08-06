import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET() {
  const baseUrl = "https://divingsanatan.online";

  try {
    const [blogsRes, servicesRes, faqRes] = await Promise.all([
      supabaseServer.from("blogs").select("id, slug, title, content, tldr, author, date").limit(20),
      supabaseServer.from("services").select("name, description, benefits, process").limit(10),
      supabaseServer.from("faq_items").select("question, answer").limit(15)
    ]);

    let fullText = `# Diving Sanatan Sanctuary - Complete LLM Context Knowledge Document\n\n`;
    fullText += `Website: ${baseUrl}\n`;
    fullText += `Contact: support@divingsanatan.online\n\n`;

    fullText += `## Core Mission & Modalities\n`;
    fullText += `Diving Sanatan Sanctuary provides energy healing, chakra restoration, sound therapy, and ancient spiritual wellness practices.\n\n`;

    fullText += `## Energy Healing Services Details\n`;
    (servicesRes.data || []).forEach(s => {
      fullText += `### ${s.name}\n${s.description || "Holistic healing session."}\n\n`;
    });

    fullText += `## Frequently Asked Questions & Answers\n`;
    (faqRes.data || []).forEach(f => {
      fullText += `Q: ${f.question}\nA: ${f.answer}\n\n`;
    });

    fullText += `## Published Guides & Knowledge Base\n`;
    (blogsRes.data || []).forEach(b => {
      fullText += `### ${b.title}\nURL: ${baseUrl}/blog/${b.slug || b.id}\nAuthor: ${b.author || "Diving Sanatan Team"}\nDate: ${b.date || ""}\n`;
      if (b.tldr) fullText += `TL;DR: ${b.tldr}\n`;
      fullText += `\n${b.content ? b.content.substring(0, 1000) : ""}\n\n---\n\n`;
    });

    return new NextResponse(fullText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch (err: any) {
    return new NextResponse(`# Diving Sanatan Sanctuary - Full Context\nWebsite: ${baseUrl}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
