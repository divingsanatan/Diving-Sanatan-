import { YOUTUBE_CHANNEL_URL } from "@/lib/youtube";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";

export async function GET() {
  const baseUrl = "https://divingsanatan.online";

  try {
    const [blogsRes, servicesRes, glossRes, faqRes, qaRes, videoRes] = await Promise.all([
      supabaseServer.from("blogs").select("id, slug, title, tldr").limit(50),
      supabaseServer.from("services").select("id, name, description").limit(20),
      supabaseServer.from("glossary_terms").select("slug, word, short_answer, definition").eq("status", "published").eq("noindex", false).order("word", { ascending: true }).limit(300),
      supabaseServer.from("faqs").select("slug, question, short_answer, answer").eq("status", "published").eq("noindex", false).order("created_at", { ascending: true }).limit(300),
      supabaseServer.from("qa_questions").select("slug, title, short_answer, answer, answerer_name").eq("status", "published").eq("noindex", false).neq("answer", "").order("answered_at", { ascending: false }).limit(300),
      supabaseServer.from("video_posts").select("slug, title, description, short_answer, youtube_id, duration_seconds").eq("status", "published").eq("noindex", false).order("upload_date", { ascending: false }).limit(300)
    ]);

    const glossaryList = (glossRes.data || []).map((t: { slug: string; word: string; short_answer?: string; definition?: string }) => {
      const plain = String(t.short_answer || t.definition || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return `- [${t.word}](${baseUrl}/blog/glossary/${t.slug}): ${plain.substring(0, 140)}${plain.length > 140 ? "…" : ""}`;
    }).join("\n");

    const faqList = (faqRes.data || []).map((f: { slug: string; question: string; short_answer?: string; answer?: string }) => {
      const plain = String(f.short_answer || f.answer || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return `- [${f.question}](${baseUrl}/blog/faq/${f.slug}): ${plain.substring(0, 140)}${plain.length > 140 ? "…" : ""}`;
    }).join("\n");

    const qaList = (qaRes.data || []).map((q: { slug: string; title: string; short_answer?: string; answer?: string; answerer_name?: string }) => {
      const plain = String(q.short_answer || q.answer || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return `- [${q.title}](${baseUrl}/blog/quora-qa/${q.slug}): ${plain.substring(0, 140)}${plain.length > 140 ? "…" : ""}${q.answerer_name ? ` (answered by ${q.answerer_name})` : ""}`;
    }).join("\n");

    const videoList = (videoRes.data || []).map((v: { slug: string; title: string; description?: string; short_answer?: string }) => {
      const plain = String(v.short_answer || v.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return `- [${v.title}](${baseUrl}/blog/video-transcripts/${v.slug}): ${plain.substring(0, 140)}${plain.length > 140 ? "…" : ""}`;
    }).join("\n");

    const blogList = (blogsRes.data || []).map(b => 
      `- [${b.title}](${baseUrl}/blog/${b.slug || b.id}): ${b.tldr || "Article on energy healing and mindfulness"}`
    ).join("\n");

    const serviceList = (servicesRes.data || []).map(s => 
      `- [${s.name}](${baseUrl}/services/${s.id}): ${s.description ? s.description.substring(0, 120) : "Holistic sanctuary service"}`
    ).join("\n");

    const content = `# Diving Sanatan Sanctuary

> Diving Sanatan Sanctuary is a spiritual, holistic energy healing and mindfulness center offering authentic Chakra Balancing, Reiki, Sound Healing, and Aura Scanning therapies.

## Core Pages
- [Home](${baseUrl}/): Main sanctuary overview and healing offerings.
- [Services](${baseUrl}/services): Full catalogue of energy healing services.
- [About Us](${baseUrl}/about): Our healers, lineage, credentials, and mission.
- [Blog & Guides](${baseUrl}/blog): Articles on spiritual growth, chakra alignment, and meditation.
- [Reviews](${baseUrl}/reviews): Verified testimonials from sanctuary seekers.

## Energy Healing Services
${serviceList || "- Chakra Balancing & Alignment\n- Sound Bath Healing\n- Usui Reiki Sessions"}

## Articles & Spiritual Guides
${blogList || "- Guides on Chakra Blocks, Energy Cleansing, and Meditation Practices"}

## Glossary of Sanatan Dharma, Chakra & Healing Terms
- [Full glossary](${baseUrl}/blog/glossary): Plain-language definitions of spiritual and energy-healing terms.
${glossaryList}

## Frequently Asked Questions
- [All questions](${baseUrl}/blog/faq): Straight answers about energy healing, chakras, meditation and booking sessions.
${faqList}

## Community Q&A (answered by our healers)
- [All answered questions](${baseUrl}/blog/quora-qa): Questions from our community about healing, chakras and meditation, answered by certified healers.
${qaList}

## Video Blogs (short vertical videos with transcripts)
- [All videos](${baseUrl}/blog/video-transcripts): Short videos on Vedic wisdom, meditation and healing. YouTube channel: ${YOUTUBE_CHANNEL_URL}
${videoList}

## Contact & Location
- Website: ${baseUrl}
- Contact Email: support@divingsanatan.online
`;

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch (err: any) {
    return new NextResponse(`# Diving Sanatan Sanctuary\nWebsite: ${baseUrl}`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
