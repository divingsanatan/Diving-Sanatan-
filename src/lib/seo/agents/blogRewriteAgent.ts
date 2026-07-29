import { supabaseServer } from "@/utils/supabaseServer";
import { callNativeAIModel } from "../utils/nativeModel";
import { ContentType, ContentFormat } from "@/types/database";

export interface BlogRewriteResult {
  blogId: string;
  contentType: ContentType;
  contentFormat: ContentFormat;
  proposedTitle: string;
  proposedContent: string;
  proposedHeadingStructure: string[];
  pendingChangeId?: string;
  success: boolean;
  error?: string;
}

export async function generateBlogRewriteSuggestion(blogId: string): Promise<BlogRewriteResult> {
  // 1. Fetch target blog post
  const { data: blog, error: fetchErr } = await supabaseServer
    .from("blogs")
    .select("*")
    .eq("id", blogId)
    .single();

  if (fetchErr || !blog) {
    return {
      blogId,
      contentType: "normal",
      contentFormat: "plain_text",
      proposedTitle: "",
      proposedContent: "",
      proposedHeadingStructure: [],
      success: false,
      error: `Blog post ${blogId} not found.`
    };
  }

  // 2. Determine content_type and content_format
  let contentType: ContentType = (blog.content_type as ContentType) || "normal";
  if (!blog.content_type) {
    const cat = (blog.category || "").toLowerCase();
    const title = (blog.title || "").toLowerCase();
    if (cat.includes("faq") || title.includes("faq")) contentType = "faq";
    else if (cat.includes("comparison") || title.includes("vs")) contentType = "comparison";
    else if (cat.includes("case study") || cat.includes("story")) contentType = "case_study";
    else if (cat.includes("glossary") || title.includes("definition")) contentType = "glossary";
    else if (cat.includes("video") || (blog.content || "").includes("<iframe")) contentType = "video";
    else if (cat.includes("quora") || cat.includes("q&a")) contentType = "qa_style";
  }

  const isHtml = (blog.content || "").includes("<p>") || (blog.content || "").includes("<div>") || (blog.content || "").includes("<h");
  const contentFormat: ContentFormat = (blog.content_format as ContentFormat) || (isHtml ? "html" : "plain_text");

  // 3. Fetch keyword research baseline from keywords table
  const { data: keywords } = await supabaseServer.from("keywords").select("word").limit(10);
  const targetKeywords = keywords ? keywords.map(k => k.word) : ["chakra healing", "somatic alignment", "energy balancing"];

  // 4. Construct AI System Prompt per content_type pattern & storage format
  const systemPrompt = `You are an On-Demand Content Rewrite Agent for Diving Sanatan Sanctuary.
Your task is to rewrite the provided post according to its structural type ("${contentType}") and output format ("${contentFormat}").

Structural Rules for ${contentType}:
- "comparison": Side-by-side comparative analysis, structured table/list, clear pros/cons.
- "faq": Direct Q&A pairs with unambiguous top answer, structured for FAQ schema.
- "glossary": Definition-first entry, Sanskrit translation, energetic meaning.
- "video": Video-first layout incorporating transcript insights and video schema.
- "qa_style": Direct-answer-first format matching natural search query intent.
- "normal" / "case_study": Problem, intervention, results, and somatic transformation.

Heading Rules:
- Exactly ONE H1 title matching primary search intent.
- Properly nested H2 and H3 subheadings with NO skipped levels (do not jump H1 to H3).
- Produce the output in ${contentFormat.toUpperCase()} format strictly.

Return a JSON object with:
1. "proposedTitle": string matching the single H1.
2. "proposedContent": rewritten body content in ${contentFormat.toUpperCase()} format.
3. "headingStructure": array of headings in order (e.g. ["H1: ...", "H2: ...", "H3: ..."]).
4. "reason": explanation of structural improvements made.`;

  const userPrompt = `Title: ${blog.title}\nCategory: ${blog.category}\nTarget Keywords: ${targetKeywords.join(", ")}\nExisting Content:\n${blog.content.substring(0, 2500)}`;

  const aiRewrite = await callNativeAIModel({ systemPrompt, userPrompt });

  const proposedTitle = aiRewrite.proposedTitle || blog.title;
  const proposedContent = aiRewrite.proposedContent || blog.content;
  const proposedHeadingStructure = Array.isArray(aiRewrite.headingStructure) ? aiRewrite.headingStructure : ["H1: " + proposedTitle, "H2: Overview", "H2: Practice"];
  const reason = aiRewrite.reason || `On-demand structural rewrite for ${contentType} content type in ${contentFormat} format.`;

  // 5. Submit proposal to pending_changes (change_type: content_rewrite)
  const { data: insertedChange, error: insertErr } = await supabaseServer
    .from("pending_changes")
    .insert([
      {
        agent_name: "on_demand_blog_rewrite",
        change_type: "content_rewrite",
        target_entity: "blogs",
        target_id: blogId,
        proposed_data: {
          title: proposedTitle,
          content: proposedContent,
          content_type: contentType,
          content_format: contentFormat,
          heading_structure: proposedHeadingStructure
        },
        current_data: {
          title: blog.title,
          content: blog.content,
          content_type: contentType,
          content_format: contentFormat
        },
        reason,
        status: "pending"
      }
    ])
    .select("id")
    .single();

  if (insertErr) {
    return {
      blogId,
      contentType,
      contentFormat,
      proposedTitle,
      proposedContent,
      proposedHeadingStructure,
      success: false,
      error: insertErr.message
    };
  }

  return {
    blogId,
    contentType,
    contentFormat,
    proposedTitle,
    proposedContent,
    proposedHeadingStructure,
    pendingChangeId: insertedChange?.id,
    success: true
  };
}
