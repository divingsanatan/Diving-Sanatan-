import { supabaseServer } from "@/utils/supabaseServer";
import { callNativeAIModel } from "../utils/nativeModel";

export interface TechnicalAuditResult {
  url: string;
  passed: boolean;
  issues: string[];
  proposedChangeCreated: boolean;
}

export async function runTechnicalSeoAgent(url: string, content: string): Promise<TechnicalAuditResult> {
  const issues: string[] = [];

  // Deterministic Checks First
  const hasCanonical = content.includes('rel="canonical"') || content.includes("canonical:");
  const hasH1 = content.includes("<h1") || content.includes("title:");
  const missingAltCount = (content.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;

  if (!hasCanonical) issues.push("Missing explicit canonical URL tag.");
  if (!hasH1) issues.push("Missing H1 heading on page.");
  if (missingAltCount > 0) issues.push(`${missingAltCount} image(s) missing required alt text attribute.`);

  // AI-Assisted Deep Technical Analysis
  const systemPrompt = `You are a Technical SEO Agent.
Analyze the HTML/page content snippet and return a JSON object with:
1. "passed": boolean
2. "issues": array of string issues found (canonical, mobile, schema, headings).
3. "proposedFix": object describing proposed code or tag update if issues exist.`;

  const userPrompt = `URL: ${url}\nContent:\n${content.substring(0, 2000)}`;
  const aiAnalysis = await callNativeAIModel({ systemPrompt, userPrompt });

  if (Array.isArray(aiAnalysis.issues)) {
    issues.push(...aiAnalysis.issues);
  }

  let proposedChangeCreated = false;

  // If technical issues are found, propose a fix to pending_changes
  if (issues.length > 0) {
    const changeObj = {
      id: `pc-${Math.random().toString(36).substring(2, 9)}`,
      agent_name: "technical_seo",
      change_type: "technical_fix",
      target_entity: "pages",
      target_id: url,
      proposed_data: {
        url,
        recommended_fixes: issues,
        canonical_url: "https://divingsanatan.online/",
        robots_directive: "index, follow"
      },
      current_data: { url, issues_found: issues },
      reason: `Technical SEO Agent flagged ${issues.length} audit issue(s): ${issues.join("; ")}`,
      status: "pending" as const,
      created_at: new Date().toISOString()
    };

    try {
      await supabaseServer.from("pending_changes").insert([changeObj]);
      proposedChangeCreated = true;
    } catch (err) {
      console.warn("Supabase pending_changes insert failed in technicalSeoAgent:", err);
    }

    try {
      const { getDb, saveDb } = require("@/utils/db");
      const db = getDb();
      db.pending_changes = db.pending_changes || [];
      db.pending_changes.unshift(changeObj);
      saveDb(db);
      proposedChangeCreated = true;
    } catch (dbErr) {
      console.error("Local db update error in technicalSeoAgent:", dbErr);
    }
  }

  return {
    url,
    passed: issues.length === 0,
    issues,
    proposedChangeCreated
  };
}
