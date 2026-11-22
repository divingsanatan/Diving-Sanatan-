import { YOUTUBE_CHANNEL_URL } from "@/lib/youtube";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { getTopicsWithItems } from "@/lib/topicsServer";
import { journeyOf, topicUrl } from "@/lib/topicsShared";

export async function GET() {
  const baseUrl = "https://divingsanatan.online";

  try {
    const [blogsRes, servicesRes, glossRes, qaRes, videoRes] = await Promise.all([
      supabaseServer.from("blogs").select("id, slug, title, content, tldr, author, date").limit(20),
      supabaseServer.from("services").select("name, description, benefits, process").limit(10),
      supabaseServer.from("glossary_terms").select("slug, word, definition, short_answer, alternate_names, key_takeaways, faqs, origin").eq("status", "published").eq("noindex", false).order("word", { ascending: true }).limit(300),
      supabaseServer.from("qa_questions").select("slug, title, description, answer, short_answer, answerer_name, answerer_role, answerer_credentials, key_takeaways, alternate_questions").eq("status", "published").eq("noindex", false).neq("answer", "").order("answered_at", { ascending: false }).limit(150),
      supabaseServer.from("video_posts").select("slug, title, description, short_answer, key_takeaways, alternate_questions, transcript, author_name, author_credentials, youtube_id, category").eq("status", "published").eq("noindex", false).order("upload_date", { ascending: false }).limit(100)
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

    const plainText = (v: unknown) => String(v || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    // Video blogs: what is said in each video (the transcript), so AI assistants can read and cite it
    fullText += `## Video Blogs (short videos with transcripts)\n`;
    fullText += `Index: ${baseUrl}/blog/video-transcripts\nYouTube channel: ${YOUTUBE_CHANNEL_URL}\n\n`;
    for (const v of (videoRes.data || []) as Array<Record<string, unknown>>) {
      fullText += `Video: ${v.title}\nURL: ${baseUrl}/blog/video-transcripts/${v.slug}\nWatch on YouTube: https://www.youtube.com/watch?v=${v.youtube_id}\n`;
      const who = [v.author_name, v.author_credentials].filter(Boolean).join(", ");
      if (who) fullText += `Speaker: ${who}\n`;
      fullText += `Summary: ${plainText(v.short_answer) || plainText(v.description)}\n`;
      const pts = Array.isArray(v.key_takeaways) ? (v.key_takeaways as string[]).filter(Boolean) : [];
      for (const k of pts) fullText += `- ${k}\n`;
      const qs = Array.isArray(v.alternate_questions) ? (v.alternate_questions as string[]).filter(Boolean) : [];
      if (qs.length) fullText += `Questions answered: ${qs.join(" | ")}\n`;
      const tr = plainText(String(v.transcript || "").replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-–:]?\s*/gm, ""));
      if (tr) fullText += `Transcript: ${tr.substring(0, 1500)}${tr.length > 1500 ? "…" : ""}\n`;
      fullText += `\n`;
    }

    // Topic guides: each topic's quick answer and the pages that make up the guide
    try {
      const topicEntries = (await getTopicsWithItems()).filter(({ topic }) => !topic.noindex);
      if (topicEntries.length) {
        fullText += `## Topic Guides\n`;
        fullText += `Index: ${baseUrl}/blog/topics\n\n`;
        for (const { topic, items } of topicEntries) {
          fullText += `### ${topic.title}\nURL: ${topicUrl(topic.slug)}\nQuick answer: ${topic.shortAnswer.replace(/\s+/g, " ").trim()}\n`;
          for (const k of topic.keyTakeaways) fullText += `- ${k}\n`;
          const path = journeyOf(items.slice());
          if (path.length) fullText += `Reading path:\n${path.map((i, n) => `${n + 1}. ${i.title} (${baseUrl}${i.path})`).join("\n")}\n`;
          fullText += `\n`;
        }
      }
    } catch {
      /* topic guides are optional */
    }

    // Community Q&A: a visitor's question with the answer a named healer gave. Answered questions only.
    fullText += `## Questions & Answers (answered by our healers and team)\n`;
    fullText += `Index: ${baseUrl}/blog/quora-qa\n\n`;
    for (const q of (qaRes.data || []) as Array<Record<string, unknown>>) {
      fullText += `Q: ${q.title}\nURL: ${baseUrl}/blog/quora-qa/${q.slug}\n`;
      const who = [q.answerer_name, q.answerer_role, q.answerer_credentials].filter(Boolean).join(", ");
      if (who) fullText += `Answered by: ${who}\n`;
      fullText += `A: ${plainText(q.short_answer) || plainText(q.answer).substring(0, 700)}\n`;
      const pts = Array.isArray(q.key_takeaways) ? (q.key_takeaways as string[]).filter(Boolean) : [];
      for (const k of pts) fullText += `- ${k}\n`;
      const alts = Array.isArray(q.alternate_questions) ? (q.alternate_questions as string[]).filter(Boolean) : [];
      if (alts.length) fullText += `Also asked: ${alts.join(" | ")}\n`;
      fullText += `\n`;
    }

    // Glossary: definitions AI assistants can quote and cite, each with its own page
    fullText += `## Glossary of Sanatan Dharma, Chakra & Healing Terms\n`;
    fullText += `Index: ${baseUrl}/blog/glossary\n\n`;
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
