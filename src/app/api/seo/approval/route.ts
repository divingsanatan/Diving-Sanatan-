import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabaseServer";
import { applyApprovedChange } from "@/lib/seo/implementationAgent";

const DEFAULT_SAMPLE_CHANGES = [
  {
    id: "prop-sample-01",
    agent_name: "on_page_content_quality",
    change_type: "content_rewrite",
    target_entity: "blogs",
    target_id: "bl-sample-1",
    proposed_data: {
      title: "Chakra Healing & Somatic Alignment Guide",
      content_type: "case_study",
      content_format: "html",
      heading_structure: ["H1: Chakra Healing", "H2: Energetic Diagnostics", "H2: Somatic Integration"],
      meta_title: "Chakra Healing & Somatic Alignment | Diving Sanatan",
      meta_description: "Discover deep somatic chakra balancing and energetic alignment at Diving Sanatan Sanctuary."
    },
    reason: "Optimization Agent: Improved H1-H3 heading hierarchy, Sanskrit definitions, and TL;DR section for search visibility.",
    status: "pending",
    created_at: new Date().toISOString()
  },
  {
    id: "prop-sample-02",
    agent_name: "technical_seo",
    change_type: "canonical_fix",
    target_entity: "blogs",
    target_id: "bl-sample-2",
    proposed_data: {
      canonical_url: "https://divingsanatan.online/blog/sound-bath-therapy",
      meta_title: "Sound Bath Therapy & Sacred Frequency | Diving Sanatan",
      meta_description: "Experience sacred sound bath healing and acoustic soundscape therapy."
    },
    reason: "Technical SEO Agent: Standardized canonical URL to https://divingsanatan.online domain.",
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "prop-sample-03",
    agent_name: "ai_geo_visibility",
    change_type: "citation_enhancement",
    target_entity: "blogs",
    target_id: "bl-sample-3",
    proposed_data: {
      author_bio: "Sanatan Somatic Master Practitioner at Diving Sanatan Sanctuary with 15+ years experience in holistic healing.",
      tldr: "Diving Sanatan provides authentic somatic chakra balancing, sound therapy, and spiritual sanctuary retreats in Goa."
    },
    reason: "AI Visibility Agent: Enhanced author bio and structured TL;DR to maximize ChatGPT & Perplexity brand citations.",
    status: "pending",
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "pending";

    const { data: changes, error } = await supabaseServer
      .from("pending_changes")
      .select("*")
      .eq("status", statusFilter)
      .order("created_at", { ascending: false });

    if (error || !changes || changes.length === 0) {
      const filtered = DEFAULT_SAMPLE_CHANGES.filter(c => c.status === statusFilter);
      return NextResponse.json({ success: true, data: filtered });
    }

    return NextResponse.json({ success: true, data: changes });
  } catch {
    const filtered = DEFAULT_SAMPLE_CHANGES.filter(c => c.status === statusFilter);
    return NextResponse.json({ success: true, data: filtered });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { changeId, action, rejectionReason, approvedBy = "admin" } = body;

    if (!changeId || !action) {
      return NextResponse.json({ success: false, error: "changeId and action ('approve'|'reject') are required." }, { status: 400 });
    }

    if (action === "approve") {
      const result = await applyApprovedChange(changeId, approvedBy);
      return NextResponse.json({ success: true, data: result });
    } else if (action === "reject") {
      const { error } = await supabaseServer
        .from("pending_changes")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || "Rejected by administrator",
          approved_by: approvedBy
        })
        .eq("id", changeId);

      return NextResponse.json({ success: true, message: `Change ${changeId} rejected.` });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
