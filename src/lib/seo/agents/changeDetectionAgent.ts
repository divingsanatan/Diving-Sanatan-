import crypto from "crypto";
import { supabaseServer } from "@/utils/supabaseServer";
import { getDb } from "@/utils/db";
import { runDiscoveryAgent } from "./discoveryAgent";
import { runTechnicalSeoAgent } from "./technicalSeoAgent";
import { runOnPageAgent } from "./onPageAgent";

export interface ScanResult {
  success: boolean;
  runId: string;
  totalUrlsChecked: number;
  changedUrlsCount: number;
  skippedUrlsCount: number;
  changedUrls: string[];
  pendingChangesGenerated: number;
  durationMs: number;
  error?: string;
}

function computeHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export async function runSiteScanPipeline(): Promise<ScanResult> {
  const startTime = Date.now();
  let runId = `scan-${Math.random().toString(36).substring(2, 9)}`;

  // Log scan start in agent_runs
  try {
    const { data: runData } = await supabaseServer
      .from("agent_runs")
      .insert([
        {
          agent_name: "change_detection_scan",
          status: "running",
          started_at: new Date().toISOString(),
          items_processed: 0,
          run_summary: { progress: "Gathering sitemap URLs..." }
        }
      ])
      .select("id")
      .single();

    if (runData?.id) runId = runData.id;
  } catch (e) {
    console.warn("Could not insert initial agent_runs row:", e);
  }

  try {
    // 1. Gather all sitemap URLs from Supabase DB and local db.json fallback
    const { data: blogs } = await supabaseServer.from("blogs").select("id, title, content, updated_at");
    const { data: services } = await supabaseServer.from("services").select("id, name, description");
    const { data: glossary } = await supabaseServer.from("glossary_terms").select("id, word, definition");
    const { data: faqs } = await supabaseServer.from("faq_items").select("id, question, answer");

    let blogList: any[] = blogs || [];
    let serviceList: any[] = services || [];
    let glossaryList: any[] = glossary || [];
    let faqList: any[] = faqs || [];

    try {
      const localDb = getDb();
      if (blogList.length === 0 && localDb.blogs) {
        blogList = localDb.blogs;
      }
      if (serviceList.length === 0 && localDb.services) {
        serviceList = localDb.services;
      }
    } catch (e) {
      console.warn("Local DB fallback warning:", e);
    }

    const urlsToScan: { url: string; content: string; entityType: string; id?: string }[] = [
      { url: "https://divingsanatan.online/", content: "Diving Sanatan Sanctuary Home Page Energy Alignment", entityType: "page" },
      { url: "https://divingsanatan.online/about", content: "About Healers & Practitioners Sanctuary Bio", entityType: "page" },
      { url: "https://divingsanatan.online/contact", content: "Contact Sanctuary Support Hours Address", entityType: "page" },
      { url: "https://divingsanatan.online/services", content: `Services Catalog ${serviceList.map(s => s.name).join(" ")}`, entityType: "page" },
      { url: "https://divingsanatan.online/blog", content: `Blog Index Page ${blogList.map(b => b.title).join(" ")}`, entityType: "page" },
      ...blogList.map(b => ({
        url: `https://divingsanatan.online/blog/${b.id}`,
        content: `${b.title} ${b.content}`,
        entityType: "blog",
        id: b.id
      })),
      ...glossaryList.slice(0, 10).map(g => ({
        url: `https://divingsanatan.online/blog/glossary#${g.id}`,
        content: `${g.word} ${g.definition}`,
        entityType: "glossary",
        id: g.id
      }))
    ];

    let changedCount = 0;
    let skippedCount = 0;
    let pendingChangesGenerated = 0;
    const changedUrls: string[] = [];

    // 2. Fetch existing snapshots from site_snapshots
    const { data: existingSnapshots } = await supabaseServer.from("site_snapshots").select("*");
    const snapshotMap = new Map<string, string>();
    if (existingSnapshots) {
      existingSnapshots.forEach((snap: any) => snapshotMap.set(snap.url, snap.content_hash));
    }

    const nowISO = new Date().toISOString();

    // 3. Process each URL
    for (const item of urlsToScan) {
      const currentHash = computeHash(item.content);
      const previousHash = snapshotMap.get(item.url);

      if (previousHash && previousHash === currentHash) {
        // Skip unchanged URL
        skippedCount++;
        continue;
      }

      // Hash changed or new URL! Update snapshot
      changedCount++;
      changedUrls.push(item.url);

      await supabaseServer.from("site_snapshots").upsert({
        url: item.url,
        content_hash: currentHash,
        last_checked_at: nowISO,
        last_changed_at: nowISO
      });

      // 4. Route changed URL to relevant downstream agents
      if (item.entityType === "blog" || item.entityType === "page") {
        // Route to Discovery Agent
        await runDiscoveryAgent(item.url, item.content);

        // Route to On-page & Content Quality Agent
        const onPageRes = await runOnPageAgent(item.url, item.content, item.id);
        if (onPageRes.proposedChangeCreated) pendingChangesGenerated++;

        // Route to Technical SEO Agent
        const techRes = await runTechnicalSeoAgent(item.url, item.content);
        if (techRes.proposedChangeCreated) pendingChangesGenerated++;
      } else {
        // Structural page -> Route to Technical SEO Agent
        const techRes = await runTechnicalSeoAgent(item.url, item.content);
        if (techRes.proposedChangeCreated) pendingChangesGenerated++;
      }
    }

    const durationMs = Date.now() - startTime;

    try {
      await supabaseServer
        .from("agent_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_processed: urlsToScan.length,
          run_summary: {
            totalUrls: urlsToScan.length,
            changedUrlsCount: changedCount,
            skippedUrlsCount: skippedCount,
            pendingChangesGenerated,
            durationMs
          }
        })
        .eq("id", runId);
    } catch (e) {
      console.warn("Supabase agent_runs update warning:", e);
    }

    try {
      const { saveDb, getDb } = require("@/utils/db");
      const db = getDb();
      db.agent_runs = db.agent_runs || [];
      db.agent_runs.unshift({
        id: runId,
        agent_name: "change_detection_scan",
        status: "completed",
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        items_processed: urlsToScan.length,
        run_summary: {
          totalUrls: urlsToScan.length,
          changedUrlsCount: changedCount,
          skippedUrlsCount: skippedCount,
          pendingChangesGenerated,
          durationMs
        }
      });
      saveDb(db);
    } catch (dbErr) {
      console.error("Local db update error for agent_runs:", dbErr);
    }

    return {
      success: true,
      runId,
      totalUrlsChecked: urlsToScan.length,
      changedUrlsCount: changedCount,
      skippedUrlsCount: skippedCount,
      changedUrls,
      pendingChangesGenerated,
      durationMs
    };
  } catch (error: any) {
    const errorMsg = error?.message || "Scan Website pipeline encountered an error";
    await supabaseServer
      .from("agent_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: errorMsg
      })
      .eq("id", runId);

    return {
      success: false,
      runId,
      totalUrlsChecked: 0,
      changedUrlsCount: 0,
      skippedUrlsCount: 0,
      changedUrls: [],
      pendingChangesGenerated: 0,
      durationMs: Date.now() - startTime,
      error: errorMsg
    };
  }
}
