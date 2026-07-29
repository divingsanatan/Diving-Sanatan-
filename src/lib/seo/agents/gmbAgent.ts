import { supabaseServer } from "@/utils/supabaseServer";
import { callNativeAIModel } from "../utils/nativeModel";

export interface GmbRunResult {
  success: boolean;
  runId: string;
  reviewsProcessed: number;
  repliesDrafted: number;
  error?: string;
}

export async function runGmbAgent(): Promise<GmbRunResult> {
  let runId = `gmb-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const { data: runData } = await supabaseServer
      .from("agent_runs")
      .insert([
        {
          agent_name: "local_gmb_agent",
          status: "running",
          started_at: new Date().toISOString(),
          items_processed: 0
        }
      ])
      .select("id")
      .single();

    if (runData?.id) runId = runData.id;
  } catch (e) {
    console.warn("Run log warning:", e);
  }

  try {
    // 1. Fetch existing customer reviews from reviews table
    const { data: reviews } = await supabaseServer.from("reviews").select("*").limit(5);
    const reviewList = reviews || [];

    let repliesDrafted = 0;

    for (const rev of reviewList) {
      const gbpReviewId = `gbp-rev-${rev.id}`;

      // Check if reply already drafted in gbp_reviews
      const { data: existingGbp } = await supabaseServer
        .from("gbp_reviews")
        .select("id")
        .eq("gbp_review_id", gbpReviewId)
        .single();

      if (existingGbp) continue;

      const systemPrompt = `You are a Local Business & Google Business Profile Review Manager for Diving Sanatan Sanctuary.
Draft a warm, polite, professional, and respectful reply to the customer's review.
Return a JSON object with:
1. "reply": string of response draft.`;

      const userPrompt = `Customer Name: ${rev.client_name || "Valued Client"}\nRating: ${rev.rating} Stars\nReview Comment: "${rev.comment}"`;
      const draftRes = await callNativeAIModel({ systemPrompt, userPrompt });

      const replyDraft = draftRes.reply || `Thank you so much for visiting Diving Sanatan Sanctuary! We are truly grateful to support your healing journey. Namaste!`;

      // Insert record into gbp_reviews
      await supabaseServer.from("gbp_reviews").insert([
        {
          gbp_review_id: gbpReviewId,
          author_name: rev.client_name || "Client",
          rating: rev.rating,
          comment: rev.comment,
          review_date: rev.date || new Date().toISOString(),
          reply_draft: replyDraft,
          reply_status: "pending",
          created_at: new Date().toISOString()
        }
      ]);

      // Propose reply in pending_changes for explicit human approval
      await supabaseServer.from("pending_changes").insert([
        {
          agent_name: "local_gmb_agent",
          change_type: "gbp_update",
          target_entity: "gbp",
          target_id: gbpReviewId,
          proposed_data: {
            gbp_review_id: gbpReviewId,
            author_name: rev.client_name,
            reply_draft: replyDraft
          },
          reason: `Drafted GMB review reply for ${rev.rating}-star review by ${rev.client_name}. Requires human approval before posting.`,
          status: "pending"
        }
      ]);

      repliesDrafted++;
    }

    await supabaseServer
      .from("agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        items_processed: reviewList.length,
        run_summary: { reviewsProcessed: reviewList.length, repliesDrafted }
      })
      .eq("id", runId);

    return { success: true, runId, reviewsProcessed: reviewList.length, repliesDrafted };
  } catch (err: any) {
    const errorMsg = err?.message || "Local GMB agent failed";
    await supabaseServer
      .from("agent_runs")
      .update({ status: "failed", error_message: errorMsg })
      .eq("id", runId);

    return { success: false, runId, reviewsProcessed: 0, repliesDrafted: 0, error: errorMsg };
  }
}
