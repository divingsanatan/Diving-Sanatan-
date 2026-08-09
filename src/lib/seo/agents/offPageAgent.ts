import { supabaseServer } from "@/utils/supabaseServer";
import { callNativeAIModel } from "../utils/nativeModel";

export interface OffPageRunResult {
  success: boolean;
  runId: string;
  opportunitiesDiscovered: number;
  error?: string;
}

export async function runOffPageAgent(): Promise<OffPageRunResult> {
  let runId = `offpage-${Math.random().toString(36).substring(2, 9)}`;

  try {
    const { data: runData } = await supabaseServer
      .from("agent_runs")
      .insert([
        {
          agent_name: "off_page_backlink",
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
    const candidateDomains = [
      { source: "https://holisticwellnessjournal.org/resources/energy-healing", da: 45 },
      { source: "https://mindfulsomaticpractices.com/blog/chakra-alignment-guides", da: 38 },
      { source: "https://spiritualjourneyreviews.net/practitioners-directory", da: 32 }
    ];

    let count = 0;

    for (const item of candidateDomains) {
      // Deterministic DA filter threshold (DA >= 25)
      if (item.da < 25) continue;

      const systemPrompt = `You are an Off-page SEO Outreach Agent.
Draft a polite, professional guest post or resource link insertion outreach email for Diving Sanatan Sanctuary.
Return a JSON object with:
1. "subject": email subject line.
2. "body": email body text.
3. "relevanceScore": numeric score 0.0 to 1.0.`;

      const userPrompt = `Target Site: ${item.source}\nDomain Authority: ${item.da}\nOur Site: https://divingsanatan.online (Somatic Chakra & Reiki Healing Sanctuary)`;
      const draftRes = await callNativeAIModel({ systemPrompt, userPrompt });

      const emailDraft = {
        subject: draftRes.subject || "Collaboration Inquiry: Somatic Energy Healing Guide",
        body: draftRes.body || "Dear Editor, I noticed your resource guide on energy healing and wanted to introduce Diving Sanatan Sanctuary...",
        status: "drafted_only_do_not_autosend"
      };

      await supabaseServer.from("backlink_opportunities").insert([
        {
          source_url: item.source,
          target_url: "https://divingsanatan.online/services",
          domain_authority: item.da,
          relevance_score: draftRes.relevanceScore || 0.85,
          status: "outreach_drafted",
          outreach_email_draft: emailDraft,
          created_at: new Date().toISOString()
        }
      ]);
      count++;
    }

    await supabaseServer
      .from("agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        items_processed: count,
        run_summary: { opportunitiesDiscovered: count }
      })
      .eq("id", runId);

    return { success: true, runId, opportunitiesDiscovered: count };
  } catch (err: any) {
    const errorMsg = err?.message || "Off-page Backlink agent failed";
    await supabaseServer
      .from("agent_runs")
      .update({ status: "failed", error_message: errorMsg })
      .eq("id", runId);

    return { success: false, runId, opportunitiesDiscovered: 0, error: errorMsg };
  }
}
