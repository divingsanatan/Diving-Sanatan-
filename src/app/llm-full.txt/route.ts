import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET() {
  const baseUrl = "https://divingsanatan.online";

  try {
    const [blogsRes, servicesRes, faqRes, glossRes] = await Promise.all([
      supabaseServer.from("blogs").select("id, slug, title, content, tldr, author, date").limit(20),
      supabaseServer.from("services").select("name, description, benefits, process").limit(10),
      supabaseServer.from("faq_items").select("question, answer").limit(15),
      supabaseServer.from("glossary_terms").select("slug, word, definition, short_answer, alternate_names, key_takeaways, faqs, origin").eq("status", "published").eq("noindex", false).order("word", { ascending: true }).limit(300)
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

    // Glossary: definitions AI assistants can quote and cite, each with its own page
    fullText += `## Glossary of Sanatan Dharma, Chakra & Healing Terms\n`;
    fullText += `Index: ${baseUrl}/blog/glossary\n\n`;
    const plainText = (v: unknown) => String(v || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    for (const t of (glossRes.data || []) as Array<Record<string, unknown>>) {
      fullText += `### ${t.word}\nURL: ${baseUrl}/blog/glossary/${t.slug}\n`;
      fullText += `${plainText(t.short_answer) || plainText(t.definition)}\n`;
      const alt = Array.isArray(t.alternate_names) ? (t.alternate_names as string[]).filter(Boolean) : [];
      if (alt.length) fullText += `Also known as: ${alt.join(", ")}\n`;
      if (t.origin) fullText += `Origin: ${plainText(t.origin)}\n`;
      const pts = Array.isArray(t.key_takeaways) ? (t.key_takeaways as string[]).filter(Boolean) : [];
      for (const k of pts) fullText += `- ${k}\n`;
      const fq = Array.isArray(t.faqs) ? (t.faqs as Array<{ question: string; answer: string }>) : [];
      for (const f of fq.slice(0, 4)) fullText += `Q: ${f.question}\nA: ${plainText(f.answer)}\n`;
      fullText += `\n`;
    }

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
