import { supabaseServer } from "@/utils/supabaseServer";
import { runPostApprovalDistribution } from "./distributionEngine";

export interface ApplyResult {
  success: boolean;
  changeId: string;
  targetEntity: string;
  appliedData: Record<string, any>;
  distributionResult?: any;
  error?: string;
}

export async function applyApprovedChange(changeId: string, approvedBy = "admin"): Promise<ApplyResult> {
  // 1. Fetch pending change record
  const { data: change, error: fetchError } = await supabaseServer
    .from("pending_changes")
    .select("*")
    .eq("id", changeId)
    .single();

  if (fetchError || !change) {
    return {
      success: false,
      changeId,
      targetEntity: "unknown",
      appliedData: {},
      error: `Pending change ${changeId} not found.`
    };
  }

  if (change.status === "applied") {
    return {
      success: false,
      changeId,
      targetEntity: change.target_entity,
      appliedData: change.proposed_data,
      error: `Change ${changeId} has already been applied.`
    };
  }

  const { target_entity, target_id, proposed_data, change_type } = change;

  try {
    // 2. Apply proposed_data to the target entity
    if (target_entity === "blogs" && target_id) {
      const updatePayload: Record<string, any> = {};
      if (proposed_data.title) updatePayload.title = proposed_data.title;
      if (proposed_data.content) updatePayload.content = proposed_data.content;
      if (proposed_data.meta_title) updatePayload.meta_title = proposed_data.meta_title;
      if (proposed_data.meta_description) updatePayload.meta_description = proposed_data.meta_description;
      if (proposed_data.focus_keyword) updatePayload.focus_keyword = proposed_data.focus_keyword;
      if (proposed_data.canonical_url) updatePayload.canonical_url = proposed_data.canonical_url;
      if (proposed_data.author_bio) updatePayload.author_bio = proposed_data.author_bio;
      if (proposed_data.reviewed_by) updatePayload.reviewed_by = proposed_data.reviewed_by;
      if (proposed_data.tldr) updatePayload.tldr = proposed_data.tldr;
      if (proposed_data.content_type) updatePayload.content_type = proposed_data.content_type;
      if (proposed_data.content_format) updatePayload.content_format = proposed_data.content_format;

      await supabaseServer.from("blogs").update(updatePayload).eq("id", target_id);
    } else if (target_entity === "redirects") {
      await supabaseServer.from("redirects").upsert({
        source_path: proposed_data.source_path,
        target_path: proposed_data.target_path,
        status_code: proposed_data.status_code || 301
      });
    }

    // 3. Mark pending_changes row as applied
    const nowISO = new Date().toISOString();
    await supabaseServer
      .from("pending_changes")
      .update({
        status: "applied",
        approved_by: approvedBy,
        approved_at: nowISO
      })
      .eq("id", changeId);

    // 4. Trigger Post-Approval Distribution
    const targetUrl = target_id
      ? `https://divingsanatan.online/blog/${target_id}`
      : "https://divingsanatan.online/";

    const distRes = await runPostApprovalDistribution({
      pendingChangeId: changeId,
      url: targetUrl,
      isGbpRelevant: change_type === "gbp_update" || target_entity === "blogs",
      changeType: change_type
    });

    return {
      success: true,
      changeId,
      targetEntity: target_entity,
      appliedData: proposed_data,
      distributionResult: distRes
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to apply change to target entity";
    return {
      success: false,
      changeId,
      targetEntity: target_entity,
      appliedData: proposed_data,
      error: errorMsg
    };
  }
}
