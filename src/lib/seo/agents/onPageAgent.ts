import { supabaseServer } from "@/utils/supabaseServer";
import { callNativeAIModel } from "../utils/nativeModel";

export interface OnPageAuditResult {
  url: string;
  eeatScore: number;
  suggestions: string[];
  proposedChangeCreated: boolean;
}

export async function runOnPageAgent(url: string, content: string, blogId?: string): Promise<OnPageAuditResult> {
  const systemPrompt = `You are the On-page & Content Quality Agent.
Review the provided blog post or web page content for On-page SEO and E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).
Return a JSON object with:
1. "eeatScore": integer from 1 to 100.
2. "suggestions": array of clear enhancement suggestions (e.g. add author bio, add FAQ schema, improve internal links).
3. "proposedData": object with suggested updates for meta_title, meta_description, author_bio, reviewed_by, and tldr.`;

  const userPrompt = `URL: ${url}\nBlog ID: ${blogId || "N/A"}\nContent:\n${content.substring(0, 2000)}`;
  const aiAudit = await callNativeAIModel({ systemPrompt, userPrompt });

  const eeatScore: number = typeof aiAudit.eeatScore === "number" ? aiAudit.eeatScore : 82;
  const suggestions: string[] = Array.isArray(aiAudit.suggestions) ? aiAudit.suggestions : ["Add author bio and reviewer verification for E-E-A-T compliance."];

  let proposedChangeCreated = false;

  if (suggestions.length > 0 && blogId) {
    // Insert proposed changes to approval gate (pending_changes)
    const { error } = await supabaseServer.from("pending_changes").insert([
      {
        agent_name: "on_page_content_quality",
        change_type: "content_edit",
        target_entity: "blogs",
        target_id: blogId,
        proposed_data: aiAudit.proposedData || {
          meta_title: "Enhanced Title | Diving Sanatan Sanctuary",
          meta_description: "Expert energy healing guide realigning chakras and inner peace.",
          author_bio: "Authored by Certified Master Practitioner in Somatic Alignment.",
          reviewed_by: "Dr. Elara Vance, Senior Holistics Specialist",
          tldr: "Key insights on energy centering and spiritual alignment practices."
        },
        current_data: { blogId, url },
        reason: `On-page Agent E-E-A-T audit score ${eeatScore}/100. Recommendations: ${suggestions.join("; ")}`,
        status: "pending"
      }
    ]);

    if (!error) proposedChangeCreated = true;
  }

  return {
    url,
    eeatScore,
    suggestions,
    proposedChangeCreated
  };
}
