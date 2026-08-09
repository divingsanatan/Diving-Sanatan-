import { supabaseServer } from "@/utils/supabaseServer";
import { runPostApprovalDistribution } from "./distributionEngine";
import { getDb, saveDb } from "@/utils/db";

export interface ApplyResult {
  success: boolean;
  changeId: string;
  targetEntity: string;
  appliedData: Record<string, any>;
  distributionResult?: any;
  error?: string;
}

export async function applyApprovedChange(changeId: string, approvedBy = "admin"): Promise<ApplyResult> {
  // 1. Fetch pending change record from db.json or Supabase
  let change: any = null;

  try {
    const db = getDb();
    if (db.pending_changes) {
      change = db.pending_changes.find((c: any) => c.id === changeId);
    }
  } catch (e) {
    // ignore
  }

  if (!change) {
    try {
      const { data } = await supabaseServer
        .from("pending_changes")
        .select("*")
        .eq("id", changeId)
        .single();
      if (data) change = data;
    } catch (e) {
      console.warn("Supabase pending_changes fetch failed:", e);
    }
  }

  if (!change) {
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
    const nowISO = new Date().toISOString();

    // 2. Apply proposed_data to local db.json
    try {
      const db = getDb();
      if (target_entity === "blogs" && target_id && db.blogs) {
        const idx = db.blogs.findIndex((b: any) => b.id === target_id);
        if (idx !== -1) {
          db.blogs[idx] = {
            ...db.blogs[idx],
            ...proposed_data,
            updated_at: nowISO
          };
        }
      }
      if (db.pending_changes) {
        const pIdx = db.pending_changes.findIndex((c: any) => c.id === changeId);
        if (pIdx !== -1) {
          db.pending_changes[pIdx].status = "applied";
          db.pending_changes[pIdx].approved_by = approvedBy;
          db.pending_changes[pIdx].approved_at = nowISO;
        }
      }
      saveDb(db);
    } catch (dbErr) {
      console.warn("Local db sync error in applyApprovedChange:", dbErr);
    }

    // 3. Apply proposed_data to Supabase in background
    if (target_entity === "blogs" && target_id) {
      const updatePayload: Record<string, any> = {};
      if (proposed_data.title) updatePayload.title = proposed_data.title;
      if (proposed_data.slug) updatePayload.slug = proposed_data.slug;
      if (proposed_data.content) updatePayload.content = proposed_data.content;
      if (proposed_data.meta_title) updatePayload.meta_title = proposed_data.meta_title;
      if (proposed_data.meta_description) updatePayload.meta_description = proposed_data.meta_description;
      if (proposed_data.focus_keyword) updatePayload.focus_keyword = proposed_data.focus_keyword;
      if (proposed_data.canonical_url) updatePayload.canonical_url = proposed_data.canonical_url;
      if (proposed_data.robots_directive) updatePayload.robots_directive = proposed_data.robots_directive;
      if (proposed_data.author_bio) updatePayload.author_bio = proposed_data.author_bio;
      if (proposed_data.reviewed_by) updatePayload.reviewed_by = proposed_data.reviewed_by;
      if (proposed_data.tldr) updatePayload.tldr = proposed_data.tldr;
      if (proposed_data.content_type) updatePayload.content_type = proposed_data.content_type;
      if (proposed_data.content_format) updatePayload.content_format = proposed_data.content_format;
      if (proposed_data.schema_type) updatePayload.schema_type = proposed_data.schema_type;
      if (proposed_data.faq_pairs) updatePayload.faq_pairs = proposed_data.faq_pairs;
      if (proposed_data.featured_image_alt) updatePayload.featured_image_alt = proposed_data.featured_image_alt;
      if (proposed_data.og_image_override) updatePayload.og_image_override = proposed_data.og_image_override;
      if (proposed_data.video_embed_url) updatePayload.video_embed_url = proposed_data.video_embed_url;
      if (proposed_data.video_transcript) updatePayload.video_transcript = proposed_data.video_transcript;
      if (proposed_data.tags) updatePayload.tags = proposed_data.tags;
      if (proposed_data.pillar_cluster) updatePayload.pillar_cluster = proposed_data.pillar_cluster;
      if (proposed_data.status) updatePayload.status = proposed_data.status;
      updatePayload.updated_at = nowISO;

      (async () => {
        try {
          await supabaseServer.from("blogs").update(updatePayload).eq("id", target_id);
        } catch (e) {}
      })();
    } else if (target_entity === "redirects") {
      (async () => {
        try {
          await supabaseServer.from("redirects").upsert({
            source_path: proposed_data.source_path,
            target_path: proposed_data.target_path,
            status_code: proposed_data.status_code || 301
          });
        } catch (e) {}
      })();
    }

    (async () => {
      try {
        await supabaseServer
          .from("pending_changes")
          .update({
            status: "applied",
            approved_by: approvedBy,
            approved_at: nowISO
          })
          .eq("id", changeId);
      } catch (e) {}
    })();

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
